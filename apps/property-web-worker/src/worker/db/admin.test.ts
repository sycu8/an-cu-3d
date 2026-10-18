// Unit tests run on Node. The worker tsconfig only loads Cloudflare types.
// @ts-expect-error node builtin is available under vitest
import { execFileSync } from "node:child_process";
// @ts-expect-error node builtin is available under vitest
import { readFileSync } from "node:fs";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../index";
import { hashPassword, validateNewPassword } from "../auth";
import type { Env } from "../types";
import {
  bootstrapAdminWithToken,
  changeAdminPassword,
  loginAdmin,
  resolveAdminSession,
  type AdminUserRow,
} from "./admin";

type Row = Record<string, unknown>;

type MemoryDb = D1Database & { userUpdateCount: () => number };

/** Minimal in-memory D1 stand-in for admin auth unit tests. */
function createMemoryDb(): MemoryDb {
  const users = new Map<string, Row>();
  const sessions = new Map<string, Row>();
  let userUpdates = 0;

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
        if (/SELECT id FROM admin_users LIMIT 1/i.test(normalized)) {
          return (users.values().next().value as T | undefined) ?? null;
        }
        if (/SELECT \* FROM admin_users WHERE (?:lower\(username\)|username)/i.test(normalized)) {
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
          const [id, username, password_hash, must_change_password] = binds;
          const conditional = /WHERE NOT EXISTS/i.test(normalized);
          if (conditional && users.size > 0) {
            return { success: true, meta: { changes: 0 } };
          }
          users.set(String(id), {
            id,
            username,
            password_hash,
            must_change_password: must_change_password == null ? 1 : Number(must_change_password),
            created_at: "now",
            updated_at: "now",
          });
          return { success: true, meta: { changes: 1 } };
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
          userUpdates += 1;
          const [password_hash, id] = binds;
          const row = users.get(String(id));
          if (row) {
            row.password_hash = password_hash;
            row.must_change_password = /must_change_password\s*=\s*1/i.test(normalized) ? 1 : 0;
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

  return { prepare, userUpdateCount: () => userUpdates } as unknown as MemoryDb;
}

/**
 * Credentials removed from apps/property-web-worker/src/worker/auth.ts:3-4.
 * Loaded from that historical blob so this file does not copy the values.
 */
const AUTH_TS_DEFAULTS_COMMIT = "fe211f5c4e7aab20ff6c2ea2750a505f60782afb";

function readHistoricalAuthSource(): string {
  const spec = `${AUTH_TS_DEFAULTS_COMMIT}:apps/property-web-worker/src/worker/auth.ts`;
  const gitEnv = { ...process.env, GIT_TERMINAL_PROMPT: "0" };
  const show = () =>
    execFileSync("git", ["show", spec], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      env: gitEnv,
    });
  try {
    return show();
  } catch {
    try {
      execFileSync("git", ["fetch", "--depth=1", "origin", AUTH_TS_DEFAULTS_COMMIT], {
        stdio: "ignore",
        env: gitEnv,
      });
    } catch {
      throw new Error("unable to load historical auth.ts:3-4");
    }
    try {
      return show();
    } catch {
      throw new Error("unable to load historical auth.ts:3-4");
    }
  }
}

let cachedRemovedCredentials: { username: string; password: string } | undefined;

function credentialsRemovedFromAuthTs(): { username: string; password: string } {
  if (cachedRemovedCredentials) return cachedRemovedCredentials;
  const lines = readHistoricalAuthSource().split(/\r?\n/);
  const username = /=\s*"([^"]*)"/.exec(lines[2] ?? "")?.[1];
  const password = /=\s*"([^"]*)"/.exec(lines[3] ?? "")?.[1];
  if (!username || !password) throw new Error("unable to parse historical auth.ts:3-4");
  cachedRemovedCredentials = { username, password };
  return cachedRemovedCredentials;
}

async function seedAdmin(
  db: D1Database,
  username: string,
  password: string,
  mustChange = 0,
): Promise<{ id: string; passwordHash: string }> {
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  await db
    .prepare(
      `INSERT INTO admin_users (id, username, password_hash, must_change_password)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(id, username, passwordHash, mustChange)
    .run();
  return { id, passwordHash };
}

async function readAdmin(db: D1Database, username: string): Promise<AdminUserRow | null> {
  return (
    (await db
      .prepare(`SELECT * FROM admin_users WHERE lower(username) = lower(?) LIMIT 1`)
      .bind(username)
      .first<AdminUserRow>()) ?? null
  );
}

describe("admin db auth flow", () => {
  let db: MemoryDb;

  beforeAll(() => {
    credentialsRemovedFromAuthTs();
  }, 20_000);

  beforeEach(() => {
    db = createMemoryDb();
  });

  it("rejects credentials previously hardcoded at auth.ts:3-4 and does not reset the hash", async () => {
    const historical = credentialsRemovedFromAuthTs();
    const storedPassword = "stored-operator-secret";
    const seeded = await seedAdmin(db, historical.username, storedPassword, 0);
    const before = await readAdmin(db, historical.username);
    expect(before?.password_hash).toBe(seeded.passwordHash);

    const attempt = await loginAdmin(db, historical.username, historical.password);
    expect(attempt.ok).toBe(false);
    if (!attempt.ok) expect(attempt.error).toBe("invalid_credentials");

    const after = await readAdmin(db, historical.username);
    expect(after?.password_hash).toBe(seeded.passwordHash);
    expect(db.userUpdateCount()).toBe(0);

    const real = await loginAdmin(db, historical.username, storedPassword);
    expect(real.ok).toBe(true);
    const afterSuccess = await readAdmin(db, historical.username);
    expect(afterSuccess?.password_hash).toBe(seeded.passwordHash);
    expect(db.userUpdateCount()).toBe(0);
  });

  it("does not create an admin when auth.ts:3-4 is submitted and no bootstrap secret is set", async () => {
    const historical = credentialsRemovedFromAuthTs();
    const attempt = await loginAdmin(db, historical.username, historical.password);
    expect(attempt.ok).toBe(false);
    expect(await readAdmin(db, historical.username)).toBeNull();
    expect(db.userUpdateCount()).toBe(0);

    const response = await worker.fetch(
      new Request("http://localhost/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: historical.username,
          password: historical.password,
        }),
      }),
      { DB: db } as unknown as Env,
    );
    expect(response.status).toBe(401);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toBe("invalid_credentials");
    expect(await readAdmin(db, historical.username)).toBeNull();
  });

  it("bootstraps the first admin from ADMIN_INITIAL_PASSWORD_HASH and never overwrites it", async () => {
    const password = "bootstrap-secret-1";
    const hash = await hashPassword(password);
    const secrets = {
      ADMIN_BOOTSTRAP_USERNAME: "operator",
      ADMIN_INITIAL_PASSWORD_HASH: hash,
    };

    const bad = await loginAdmin(db, "operator", "wrong-password", secrets);
    expect(bad.ok).toBe(false);
    const created = await readAdmin(db, "operator");
    expect(created?.password_hash).toBe(hash);
    expect(created?.must_change_password).toBe(1);
    expect(db.userUpdateCount()).toBe(0);

    const good = await loginAdmin(db, "operator", password, secrets);
    expect(good.ok).toBe(true);
    if (!good.ok) return;
    expect(good.mustChangePassword).toBe(true);
    expect((await readAdmin(db, "operator"))?.password_hash).toBe(hash);

    const replacement = await hashPassword("other-password-value");
    const overwritten = await loginAdmin(db, "operator", "other-password-value", {
      ADMIN_BOOTSTRAP_USERNAME: "operator",
      ADMIN_INITIAL_PASSWORD_HASH: replacement,
    });
    expect(overwritten.ok).toBe(false);
    expect((await readAdmin(db, "operator"))?.password_hash).toBe(hash);
    expect(db.userUpdateCount()).toBe(0);
  });

  it("rejects a plaintext bootstrap secret instead of storing it as the password", async () => {
    await expect(
      loginAdmin(db, "operator", "plaintext-secret", {
        ADMIN_BOOTSTRAP_USERNAME: "operator",
        ADMIN_INITIAL_PASSWORD_HASH: "plaintext-secret",
      }),
    ).rejects.toThrow(/invalid_bootstrap_hash/);
    expect(await readAdmin(db, "operator")).toBeNull();
  });

  it("inserts only one admin when two bootstraps run together", async () => {
    const token = "0123456789abcdef0123456789abcdef";
    const secrets = { ADMIN_BOOTSTRAP_TOKEN: `  ${token}  ` };
    const [first, second] = await Promise.all([
      bootstrapAdminWithToken(db, secrets, {
        token,
        username: "operator-a",
        password: "chosen-operator-secret-a",
      }),
      bootstrapAdminWithToken(db, secrets, {
        token,
        username: "operator-b",
        password: "chosen-operator-secret-b",
      }),
    ]);
    const results = [first, second];
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toEqual([
      { ok: false, error: "admin_exists" },
    ]);
    const stored = [await readAdmin(db, "operator-a"), await readAdmin(db, "operator-b")].filter(
      Boolean,
    );
    expect(stored).toHaveLength(1);
  });

  it("disables bootstrap when ADMIN_BOOTSTRAP_TOKEN is under 32 characters", async () => {
    const result = await bootstrapAdminWithToken(
      db,
      { ADMIN_BOOTSTRAP_TOKEN: "  short-token  " },
      {
        token: "short-token",
        username: "operator",
        password: "chosen-operator-secret",
      },
    );
    expect(result).toEqual({ ok: false, error: "bootstrap_disabled" });
    expect(await readAdmin(db, "operator")).toBeNull();
  });

  it("spends a PBKDF2 proof when the username does not exist", async () => {
    const spy = vi.spyOn(crypto.subtle, "deriveBits");
    try {
      const result = await loginAdmin(db, "missing-operator", "not-a-stored-password");
      expect(result.ok).toBe(false);
      expect(spy).toHaveBeenCalledTimes(1);
      const params = spy.mock.calls[0]?.[0] as { iterations?: number };
      expect(params.iterations).toBe(100_000);
    } finally {
      spy.mockRestore();
    }
  });

  it("creates the first admin once from ADMIN_BOOTSTRAP_TOKEN and then refuses", async () => {
    const secrets = { ADMIN_BOOTSTRAP_TOKEN: "0123456789abcdef0123456789abcdef" };
    const created = await bootstrapAdminWithToken(db, secrets, {
      token: "0123456789abcdef0123456789abcdef",
      username: "operator",
      password: "chosen-operator-secret",
    });
    expect(created).toEqual({ ok: true, username: "operator" });
    const row = await readAdmin(db, "operator");
    expect(row?.must_change_password).toBe(0);
    const hashAfterCreate = row?.password_hash;

    const again = await bootstrapAdminWithToken(db, secrets, {
      token: "0123456789abcdef0123456789abcdef",
      username: "operator",
      password: "another-operator-secret",
    });
    expect(again).toEqual({ ok: false, error: "admin_exists" });
    expect((await readAdmin(db, "operator"))?.password_hash).toBe(hashAfterCreate);

    const login = await loginAdmin(db, "operator", "chosen-operator-secret");
    expect(login.ok).toBe(true);
    expect((await readAdmin(db, "operator"))?.password_hash).toBe(hashAfterCreate);
  });

  it("serves POST /api/admin/bootstrap only while the token secret is set and no admin exists", async () => {
    const disabled = await worker.fetch(
      new Request("http://localhost/api/admin/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "0123456789abcdef0123456789abcdef",
          username: "operator",
          password: "chosen-operator-secret",
        }),
      }),
      { DB: db } as unknown as Env,
    );
    expect(disabled.status).toBe(404);

    const env = { DB: db, ADMIN_BOOTSTRAP_TOKEN: "0123456789abcdef0123456789abcdef" } as unknown as Env;
    const wrong = await worker.fetch(
      new Request("http://localhost/api/admin/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "not-the-token",
          username: "operator",
          password: "chosen-operator-secret",
        }),
      }),
      env,
    );
    expect(wrong.status).toBe(401);
    expect(await readAdmin(db, "operator")).toBeNull();

    const ok = await worker.fetch(
      new Request("http://localhost/api/admin/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "0123456789abcdef0123456789abcdef",
          username: "operator",
          password: "chosen-operator-secret",
        }),
      }),
      env,
    );
    expect(ok.status).toBe(201);
    const created = (await ok.json()) as { ok?: boolean; username?: string };
    expect(created).toEqual({ ok: true, username: "operator" });

    const conflict = await worker.fetch(
      new Request("http://localhost/api/admin/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "0123456789abcdef0123456789abcdef",
          username: "second",
          password: "another-operator-secret",
        }),
      }),
      env,
    );
    expect(conflict.status).toBe(409);
    expect(await readAdmin(db, "second")).toBeNull();
  });

  it("changes password and invalidates prior sessions", async () => {
    const current = "current-operator-secret";
    await seedAdmin(db, "operator", current, 0);
    const login = await loginAdmin(db, "operator", current);
    expect(login.ok).toBe(true);
    if (!login.ok) return;

    const auth = await resolveAdminSession(db, login.token);
    expect(auth).toBeTruthy();
    if (!auth) return;

    const next = "new-secure-pass";
    expect(validateNewPassword(next, auth.user.username)).toBeNull();
    const hashed = await hashPassword(next);
    const changed = await changeAdminPassword(db, auth.user, current, hashed);
    expect(changed.ok).toBe(true);

    expect(await resolveAdminSession(db, login.token)).toBeNull();

    const again = await loginAdmin(db, "operator", next);
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.mustChangePassword).toBe(false);
  });

  it("leaves a corrupt hash unchanged when the removed auth.ts:3-4 password is submitted", async () => {
    const historical = credentialsRemovedFromAuthTs();
    const { id } = await seedAdmin(db, historical.username, "current-operator-secret", 1);
    await db
      .prepare(`UPDATE admin_users SET password_hash = ?, must_change_password = 1 WHERE id = ?`)
      .bind("not-a-valid-hash", id)
      .run();
    const updatesAfterCorrupt = db.userUpdateCount();

    const login = await loginAdmin(db, historical.username, historical.password);
    expect(login.ok).toBe(false);
    const row = await readAdmin(db, historical.username);
    expect(row?.password_hash).toBe("not-a-valid-hash");
    expect(db.userUpdateCount()).toBe(updatesAfterCorrupt);
  });

  it("does not mention the removed default in the admin UI", () => {
    const cwd = (globalThis as unknown as { process: { cwd: () => string } }).process.cwd();
    const readSource = (rel: string) => {
      const candidates = [`${cwd}/${rel}`, `${cwd}/apps/property-web-worker/${rel}`];
      for (const path of candidates) {
        try {
          return readFileSync(path, "utf8");
        } catch {
          // Try the other cwd layout.
        }
      }
      throw new Error(`unable to read ${rel}`);
    };
    const page = readSource("src/routes/AdminPage.tsx");
    const admin = readSource("src/worker/db/admin.ts");
    const auth = readSource("src/worker/auth.ts");
    expect(page).not.toContain("password_is_default");
    expect(page).not.toMatch(/setCurrentPassword\(\s*["'][^"']+["']/);
    expect(admin).not.toContain("repairDefaultAdminPassword");
    expect(admin).not.toContain("DEFAULT_ADMIN_PASSWORD");
    expect(admin).not.toContain("DEFAULT_ADMIN_USERNAME");
    expect(auth).not.toContain("DEFAULT_ADMIN_PASSWORD");
    expect(auth).not.toContain("DEFAULT_ADMIN_USERNAME");
    expect(auth).not.toContain("password_is_default");
  });
});
