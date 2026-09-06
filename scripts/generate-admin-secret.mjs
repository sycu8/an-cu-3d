#!/usr/bin/env node
/**
 * Generate a local ADMIN_SECRET for property-web-worker/.dev.vars
 * Usage: node scripts/generate-admin-secret.mjs
 */
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const secret = randomBytes(32).toString("base64url");
const varsPath = resolve("apps/property-web-worker/.dev.vars");
const examplePath = resolve("apps/property-web-worker/.dev.vars.example");

let text = existsSync(varsPath) ? readFileSync(varsPath, "utf8") : "";
if (!text.trim() && existsSync(examplePath)) {
  text = readFileSync(examplePath, "utf8");
}
if (/^ADMIN_SECRET=.*/m.test(text)) {
  text = text.replace(/^ADMIN_SECRET=.*/m, `ADMIN_SECRET=${secret}`);
} else {
  text = `${text.trimEnd()}\nADMIN_SECRET=${secret}\n`;
}
writeFileSync(varsPath, text.endsWith("\n") ? text : `${text}\n`);
console.log("Wrote ADMIN_SECRET to apps/property-web-worker/.dev.vars");
console.log(`ADMIN_SECRET=${secret}`);
console.log("Production: pnpm --filter @ancu/property-web-worker exec wrangler secret put ADMIN_SECRET");
