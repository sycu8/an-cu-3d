import {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  parsePasswordHash,
  performPasswordProof,
  sessionExpiresAt,
  timingSafeEqual,
  validateNewPassword,
  verifyPassword,
} from "../auth";

const MIN_BOOTSTRAP_TOKEN_LENGTH = 32;

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

/** Worker secrets used to create the first admin. Login never falls back to a default. */
export type AdminBootstrapSecrets = {
  /** One-time token for POST /api/admin/bootstrap. Ignored once any admin exists. */
  ADMIN_BOOTSTRAP_TOKEN?: string;
  /** Username inserted only when admin_users is empty. */
  ADMIN_BOOTSTRAP_USERNAME?: string;
  /** Serialized pbkdf2-sha256 hash. Not a plaintext password. */
  ADMIN_INITIAL_PASSWORD_HASH?: string;
};

function usernameLookupSql(): string {
  // lower() avoids D1/SQLite quirks with `= ? COLLATE NOCASE` precedence
  return `SELECT * FROM admin_users WHERE lower(username) = lower(?) LIMIT 1`;
}

async function adminExists(db: D1Database): Promise<boolean> {
  const row = await db.prepare(`SELECT id FROM admin_users LIMIT 1`).first<{ id: string }>();
  return Boolean(row);
}

/**
 * One statement so two concurrent bootstraps cannot both insert.
 * Returns true only when this call inserted the single row.
 */
async function insertFirstAdmin(
  db: D1Database,
  username: string,
  passwordHash: string,
  mustChangePassword: boolean,
): Promise<boolean> {
  const id = crypto.randomUUID();
  const result = await db
    .prepare(
      `INSERT INTO admin_users (id, username, password_hash, must_change_password)
       SELECT ?, ?, ?, ?
       WHERE NOT EXISTS (SELECT 1 FROM admin_users)`,
    )
    .bind(id, username, passwordHash, mustChangePassword ? 1 : 0)
    .run();
  return result.meta?.changes === 1;
}

/**
 * Insert the first operator from ADMIN_BOOTSTRAP_USERNAME + ADMIN_INITIAL_PASSWORD_HASH
 * when admin_users is empty. Existing rows are never updated.
 */
export async function bootstrapInitialAdmin(
  db: D1Database,
  secrets: AdminBootstrapSecrets | undefined,
): Promise<void> {
  const username = secrets?.ADMIN_BOOTSTRAP_USERNAME?.trim() ?? "";
  const passwordHash = secrets?.ADMIN_INITIAL_PASSWORD_HASH?.trim() ?? "";
  if (!username || !passwordHash) return;
  if (!parsePasswordHash(passwordHash)) {
    // A bad secret must not lock out an operator who already exists.
    if (await adminExists(db)) return;
    throw new Error("invalid_bootstrap_hash");
  }
  await insertFirstAdmin(db, username, passwordHash, true);
}

async function bootstrapTokenMatches(provided: string, expected: string): Promise<boolean> {
  // Hash both sides first so the compare does not leak length.
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  return timingSafeEqual(new Uint8Array(providedHash), new Uint8Array(expectedHash));
}

export async function bootstrapAdminWithToken(
  db: D1Database,
  secrets: AdminBootstrapSecrets | undefined,
  input: { token: string; username: string; password: string },
): Promise<
  | { ok: true; username: string }
  | {
      ok: false;
      error:
        | "bootstrap_disabled"
        | "invalid_credentials"
        | "admin_exists"
        | "username_required"
        | "password_too_short"
        | "password_matches_username";
    }
> {
  const expected = secrets?.ADMIN_BOOTSTRAP_TOKEN?.trim() ?? "";
  if (expected.length < MIN_BOOTSTRAP_TOKEN_LENGTH) {
    return { ok: false, error: "bootstrap_disabled" };
  }

  const token = input.token ?? "";
  const username = input.username?.trim() ?? "";
  const password = input.password ?? "";
  if (!token || !username || !password) {
    return { ok: false, error: "invalid_credentials" };
  }
  if (!(await bootstrapTokenMatches(token, expected))) {
    return { ok: false, error: "invalid_credentials" };
  }
  if (username.length > 64 || /\s/.test(username)) {
    return { ok: false, error: "username_required" };
  }
  const passwordError = validateNewPassword(password, username);
  if (passwordError === "password_too_short" || passwordError === "password_matches_username") {
    return { ok: false, error: passwordError };
  }

  const passwordHash = await hashPassword(password);
  const inserted = await insertFirstAdmin(db, username, passwordHash, false);
  if (!inserted) return { ok: false, error: "admin_exists" };
  return { ok: true, username };
}

export async function findAdminByUsername(
  db: D1Database,
  username: string,
): Promise<AdminUserRow | null> {
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

export async function loginAdmin(
  db: D1Database,
  username: string,
  password: string,
  secrets?: AdminBootstrapSecrets,
): Promise<
  | { ok: true; token: string; username: string; mustChangePassword: boolean }
  | { ok: false; error: "invalid_credentials" }
> {
  const bootstrapUsername = secrets?.ADMIN_BOOTSTRAP_USERNAME?.trim() ?? "";
  if (
    bootstrapUsername &&
    secrets?.ADMIN_INITIAL_PASSWORD_HASH?.trim() &&
    username.trim().toLowerCase() === bootstrapUsername.toLowerCase()
  ) {
    // Insert-only. A failed login must not rewrite password_hash.
    await bootstrapInitialAdmin(db, secrets);
  }

  const user = await findAdminByUsername(db, username);
  if (!user) {
    await performPasswordProof(password);
    return { ok: false, error: "invalid_credentials" };
  }

  const valid = await verifyPassword(password, user.password_hash);
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
