/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  ASSETS: R2Bucket;
  /** Cloudflare Images binding for resize/optimize from R2 bytes. */
  IMAGES?: ImagesBinding;
  APP_VERSION?: string;
  ADMIN_SECRET?: string;
  AI_GATEWAY_ACCOUNT_ID?: string;
  AI_GATEWAY_ID?: string;
  AI_GATEWAY_TOKEN?: string;
  ENGINE_BASE_URL?: string;
  ENGINE_API_SECRET?: string;
  AI?: Ai;
}
