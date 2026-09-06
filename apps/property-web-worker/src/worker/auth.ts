/** Admin username/password + opaque session tokens (Workers Web Crypto). */

export const DEFAULT_ADMIN_USERNAME = "Sycule96";
export const DEFAULT_ADMIN_PASSWORD = "admin";

const PBKDF2_ITERATIONS = 100_000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type PasswordHashRecord = {
  algorithm: "pbkdf2-sha256";
  iterations: number;
  saltB64: string;
  hashB64: string;
};

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  let out = 0;
  for (let i = 0; i < a.byteLength; i++) {
    out |= a[i]! ^ b[i]!;
  }
  return out === 0;
}

function bytesToB64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function b64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToB64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function serializePasswordHash(record: PasswordHashRecord): string {
  return `${record.algorithm}$${record.iterations}$${record.saltB64}$${record.hashB64}`;
}

export function parsePasswordHash(serialized: string): PasswordHashRecord | null {
  const parts = serialized.split("$");
  if (parts.length !== 4) return null;
  const [algorithm, iterationsRaw, saltB64, hashB64] = parts;
  if (algorithm !== "pbkdf2-sha256" || !saltB64 || !hashB64) return null;
  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations < 10_000) return null;
  return { algorithm, iterations, saltB64, hashB64 };
}

async function derivePbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePbkdf2(password, salt, PBKDF2_ITERATIONS);
  return serializePasswordHash({
    algorithm: "pbkdf2-sha256",
    iterations: PBKDF2_ITERATIONS,
    saltB64: bytesToB64(salt),
    hashB64: bytesToB64(hash),
  });
}

export async function verifyPassword(password: string, serialized: string): Promise<boolean> {
  const record = parsePasswordHash(serialized);
  if (!record) return false;
  const salt = b64ToBytes(record.saltB64);
  const expected = b64ToBytes(record.hashB64);
  const actual = await derivePbkdf2(password, salt, record.iterations);
  if (actual.byteLength !== expected.byteLength) return false;
  return timingSafeEqual(actual, expected);
}

export async function hashSessionToken(token: string): Promise<string> {
  const dig = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return bytesToB64(new Uint8Array(dig));
}

export function createSessionToken(): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export function sessionExpiresAt(now = Date.now()): string {
  const d = new Date(now + SESSION_TTL_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  // SQLite datetime('now') format (UTC) for reliable string comparison
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

export function extractBearerToken(authorization: string | null): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

export function validateNewPassword(password: string, username: string): string | null {
  if (password === DEFAULT_ADMIN_PASSWORD) return "password_is_default";
  if (password.toLowerCase() === username.toLowerCase()) return "password_matches_username";
  if (password.length < 8) return "password_too_short";
  return null;
}
