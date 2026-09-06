import {
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  sessionExpiresAt,
  verifyPassword,
} from "../auth";

export type AdminUserRow = {
  id: string;
  username: string;
  password_hash: string;
  must_change_password: number;
  created_at: string;
  updated_at: string;
};

export type AdminSessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
};

export type AdminAuthContext = {
  user: AdminUserRow;
  session: AdminSessionRow;
  token: string;
};

function usernameLookupSql(): string {
  // lower() avoids D1/SQLite quirks with `= ? COLLATE NOCASE` precedence
  return `SELECT * FROM admin_users WHERE lower(username) = lower(?) LIMIT 1`;
}

export async function ensureDefaultAdmin(db: D1Database): Promise<AdminUserRow> {
  const existing = await db
    .prepare(usernameLookupSql())
    .bind(DEFAULT_ADMIN_USERNAME)
    .first<AdminUserRow>();
  if (existing) return existing;

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  try {
    await db
      .prepare(
        `INSERT INTO admin_users (id, username, password_hash, must_change_password)
         VALUES (?, ?, ?, 1)`,
      )
      .bind(id, DEFAULT_ADMIN_USERNAME, passwordHash)
      .run();
  } catch (err) {
    // Race: another request inserted first — load that row
    const raced = await db
      .prepare(usernameLookupSql())
      .bind(DEFAULT_ADMIN_USERNAME)
      .first<AdminUserRow>();
    if (raced) return raced;
    throw err;
  }

  const created = await db
    .prepare(`SELECT * FROM admin_users WHERE id = ?`)
    .bind(id)
    .first<AdminUserRow>();
  if (!created) throw new Error("failed_to_bootstrap_admin");
  return created;
}

export async function findAdminByUsername(
  db: D1Database,
  username: string,
): Promise<AdminUserRow | null> {
  await ensureDefaultAdmin(db);
  return (await db.prepare(usernameLookupSql()).bind(username.trim()).first<AdminUserRow>()) ?? null;
}

export async function createAdminSession(
  db: D1Database,
  userId: string,
): Promise<{ token: string; session: AdminSessionRow }> {
  const token = createSessionToken();
  const tokenHash = await hashSessionToken(token);
  const id = crypto.randomUUID();
  const expiresAt = sessionExpiresAt();
  await db
    .prepare(
      `INSERT INTO admin_sessions (id, user_id, token_hash, expires_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(id, userId, tokenHash, expiresAt)
    .run();
  const session = await db
    .prepare(`SELECT * FROM admin_sessions WHERE id = ?`)
    .bind(id)
    .first<AdminSessionRow>();
  if (!session) throw new Error("failed_to_create_session");
  return { token, session };
}

export async function resolveAdminSession(
  db: D1Database,
  token: string,
): Promise<AdminAuthContext | null> {
  if (!token) return null;
  await ensureDefaultAdmin(db);
  const tokenHash = await hashSessionToken(token);
  const session = await db
    .prepare(
      `SELECT * FROM admin_sessions
       WHERE token_hash = ? AND expires_at > datetime('now')
       LIMIT 1`,
    )
    .bind(tokenHash)
    .first<AdminSessionRow>();
  if (!session) return null;

  const user = await db
    .prepare(`SELECT * FROM admin_users WHERE id = ?`)
    .bind(session.user_id)
    .first<AdminUserRow>();
  if (!user) return null;
  return { user, session, token };
}

export async function deleteAdminSession(db: D1Database, sessionId: string): Promise<void> {
  await db.prepare(`DELETE FROM admin_sessions WHERE id = ?`).bind(sessionId).run();
}

export async function deleteAdminSessionsForUser(db: D1Database, userId: string): Promise<void> {
  await db.prepare(`DELETE FROM admin_sessions WHERE user_id = ?`).bind(userId).run();
}

/**
 * If the default operator row exists but its hash cannot verify the default
 * password (corrupt/partial bootstrap), re-seed the default hash and force
 * password change again.
 */
async function repairDefaultAdminPassword(
  db: D1Database,
  user: AdminUserRow,
  password: string,
): Promise<AdminUserRow | null> {
  const isDefaultUser =
    user.username.toLowerCase() === DEFAULT_ADMIN_USERNAME.toLowerCase();
  if (!isDefaultUser || password !== DEFAULT_ADMIN_PASSWORD) return null;

  const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  await db
    .prepare(
      `UPDATE admin_users
       SET password_hash = ?, must_change_password = 1, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(passwordHash, user.id)
    .run();

  return (
    (await db
      .prepare(`SELECT * FROM admin_users WHERE id = ?`)
      .bind(user.id)
      .first<AdminUserRow>()) ?? null
  );
}

export async function loginAdmin(
  db: D1Database,
  username: string,
  password: string,
): Promise<
  | { ok: true; token: string; username: string; mustChangePassword: boolean }
  | { ok: false; error: "invalid_credentials" }
> {
  let user = await findAdminByUsername(db, username);
  if (!user) return { ok: false, error: "invalid_credentials" };

  let valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    const repaired = await repairDefaultAdminPassword(db, user, password);
    if (repaired) {
      user = repaired;
      valid = await verifyPassword(password, user.password_hash);
    }
  }
  if (!valid) return { ok: false, error: "invalid_credentials" };

  const { token } = await createAdminSession(db, user.id);
  return {
    ok: true,
    token,
    username: user.username,
    mustChangePassword: user.must_change_password === 1,
  };
}

export async function changeAdminPassword(
  db: D1Database,
  user: AdminUserRow,
  currentPassword: string,
  newPasswordHash: string,
): Promise<{ ok: true } | { ok: false; error: "invalid_current_password" }> {
  const valid = await verifyPassword(currentPassword, user.password_hash);
  if (!valid) return { ok: false, error: "invalid_current_password" };

  await db
    .prepare(
      `UPDATE admin_users
       SET password_hash = ?, must_change_password = 0, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(newPasswordHash, user.id)
    .run();

  // Force re-login on other devices after password change
  await deleteAdminSessionsForUser(db, user.id);
  return { ok: true };
}
