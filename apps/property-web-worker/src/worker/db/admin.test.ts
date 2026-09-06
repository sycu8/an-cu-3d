import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
  hashPassword,
  validateNewPassword,
} from "../auth";
import {
  changeAdminPassword,
  ensureDefaultAdmin,
  loginAdmin,
  resolveAdminSession,
} from "./admin";

type Row = Record<string, unknown>;

/** Minimal in-memory D1 stand-in for admin auth unit tests. */
function createMemoryDb() {
  const users = new Map<string, Row>();
  const sessions = new Map<string, Row>();

  function matchWhere(row: Row, where: string, binds: unknown[]): boolean {
    if (!where.trim()) return true;
    const clauses = where.split(/\s+AND\s+/i);
    let bindIdx = 0;
    for (const clause of clauses) {
      const eq = clause.match(/(\w+)\s*=\s*\?/i);
      if (eq) {
        const key = eq[1]!.toLowerCase();
        const expected = binds[bindIdx++];
        const actual = row[key];
        if (clause.toUpperCase().includes("COLLATE NOCASE")) {
          if (String(actual).toLowerCase() !== String(expected).toLowerCase()) return false;
        } else if (actual !== expected) {
          return false;
        }
        continue;
      }
      const gt = clause.match(/(\w+)\s*>\s*datetime\('now'\)/i);
      if (gt) {
        const key = gt[1]!.toLowerCase();
        const value = String(row[key] ?? "");
        const now = new Date().toISOString().replace("T", " ").slice(0, 19);
        if (!(value > now)) return false;
        continue;
      }
    }
    return true;
  }

  function prepare(sql: string) {
    const binds: unknown[] = [];
    const api = {
      bind(...args: unknown[]) {
        binds.push(...args);
        return api;
      },
      async first<T>() {
        const normalized = sql.replace(/\s+/g, " ").trim();
        if (/SELECT \* FROM admin_users WHERE username/i.test(normalized)) {
          const username = String(binds[0] ?? "");
          for (const row of users.values()) {
            if (String(row.username).toLowerCase() === username.toLowerCase()) {
              return row as T;
            }
          }
          return null;
        }
        if (/SELECT \* FROM admin_users WHERE id/i.test(normalized)) {
          return (users.get(String(binds[0])) as T) ?? null;
        }
        if (/SELECT \* FROM admin_sessions WHERE id/i.test(normalized)) {
          return (sessions.get(String(binds[0])) as T) ?? null;
        }
        if (/SELECT \* FROM admin_sessions/i.test(normalized)) {
          for (const row of sessions.values()) {
            if (matchWhere(row, "token_hash = ? AND expires_at > datetime('now')", binds)) {
              return row as T;
            }
          }
          return null;
        }
        return null;
      },
      async run() {
        const normalized = sql.replace(/\s+/g, " ").trim();
        if (/INSERT INTO admin_users/i.test(normalized)) {
          const [id, username, password_hash] = binds;
          users.set(String(id), {
            id,
            username,
            password_hash,
            must_change_password: 1,
            created_at: "now",
            updated_at: "now",
          });
          return { success: true };
        }
        if (/INSERT INTO admin_sessions/i.test(normalized)) {
          const [id, user_id, token_hash, expires_at] = binds;
          sessions.set(String(id), {
            id,
            user_id,
            token_hash,
            expires_at,
            created_at: "now",
          });
          return { success: true };
        }
        if (/UPDATE admin_users/i.test(normalized)) {
          const [password_hash, id] = binds;
          const row = users.get(String(id));
          if (row) {
            row.password_hash = password_hash;
            row.must_change_password = 0;
            row.updated_at = "now";
          }
          return { success: true };
        }
        if (/DELETE FROM admin_sessions WHERE id/i.test(normalized)) {
          sessions.delete(String(binds[0]));
          return { success: true };
        }
        if (/DELETE FROM admin_sessions WHERE user_id/i.test(normalized)) {
          for (const [id, row] of [...sessions.entries()]) {
            if (row.user_id === binds[0]) sessions.delete(id);
          }
          return { success: true };
        }
        throw new Error(`unsupported sql: ${normalized}`);
      },
    };
    return api;
  }

  return { prepare } as unknown as D1Database;
}

describe("admin db auth flow", () => {
  let db: D1Database;

  beforeEach(() => {
    db = createMemoryDb();
  });

  it("bootstraps default admin and requires password change", async () => {
    const user = await ensureDefaultAdmin(db);
    expect(user.username).toBe(DEFAULT_ADMIN_USERNAME);
    expect(user.must_change_password).toBe(1);

    const bad = await loginAdmin(db, DEFAULT_ADMIN_USERNAME, "wrong");
    expect(bad.ok).toBe(false);

    const good = await loginAdmin(db, DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD);
    expect(good.ok).toBe(true);
    if (!good.ok) return;
    expect(good.mustChangePassword).toBe(true);

    const session = await resolveAdminSession(db, good.token);
    expect(session?.user.username).toBe(DEFAULT_ADMIN_USERNAME);
  });

  it("changes password and invalidates prior sessions", async () => {
    const login = await loginAdmin(db, DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD);
    expect(login.ok).toBe(true);
    if (!login.ok) return;

    const auth = await resolveAdminSession(db, login.token);
    expect(auth).toBeTruthy();
    if (!auth) return;

    const next = "new-secure-pass";
    expect(validateNewPassword(next, auth.user.username)).toBeNull();
    const hashed = await hashPassword(next);
    const changed = await changeAdminPassword(db, auth.user, DEFAULT_ADMIN_PASSWORD, hashed);
    expect(changed.ok).toBe(true);

    expect(await resolveAdminSession(db, login.token)).toBeNull();

    const again = await loginAdmin(db, DEFAULT_ADMIN_USERNAME, next);
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.mustChangePassword).toBe(false);
  });
});
