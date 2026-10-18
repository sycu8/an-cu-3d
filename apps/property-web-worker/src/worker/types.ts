/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  ASSETS: R2Bucket;
  /**
   * Workers static assets (wrangler `assets.binding`).
   * Distinct from the R2 bucket `ASSETS`. Used so missing `/assets/*` chunks
   * can 404 instead of inheriting the SPA index.html fallback.
   */
  STATIC_ASSETS?: Fetcher;
  /** Cloudflare Images binding for resize/optimize from R2 bytes. */
  IMAGES?: ImagesBinding;
  APP_VERSION?: string;
  AI_GATEWAY_ACCOUNT_ID?: string;
  AI_GATEWAY_ID?: string;
  AI_GATEWAY_TOKEN?: string;
  ENGINE_BASE_URL?: string;
  ENGINE_API_SECRET?: string;
  /**
   * One-time setup token for POST /api/admin/bootstrap.
   * Honored only while admin_users is empty. Set with `wrangler secret put`.
   */
  ADMIN_BOOTSTRAP_TOKEN?: string;
  /**
   * Username inserted only when admin_users is empty.
   * Pair with ADMIN_INITIAL_PASSWORD_HASH. Never overwrites an existing row.
   */
  ADMIN_BOOTSTRAP_USERNAME?: string;
  /**
   * Serialized pbkdf2-sha256 hash (algorithm$iterations$salt$hash).
   * Not a plaintext password. Used once to insert the first admin.
   */
  ADMIN_INITIAL_PASSWORD_HASH?: string;
  AI?: Ai;
}
