import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Build stamp read by wrangler when `deploy --env` does not match the build. */
export function buildTargetEnvironment(cloudflareEnv) {
  const trimmed = cloudflareEnv?.trim();
  return trimmed ? trimmed : "top-level";
}

function wranglerConfigs(dir, found) {
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const path = join(dir, name);
    let info;
    try {
      info = statSync(path);
    } catch {
      continue;
    }
    if (info.isDirectory()) wranglerConfigs(path, found);
    else if (name === "wrangler.json") found.push(path);
  }
}

/**
 * Record which environment Vite baked into dist.
 * A later `wrangler deploy --env <other>` then fails instead of shipping
 * the baked bindings under the baked worker name.
 */
export function stampBuildEnvironment(distDir, cloudflareEnv) {
  const target = buildTargetEnvironment(cloudflareEnv);
  const files = [];
  wranglerConfigs(distDir, files);
  for (const file of files) {
    const config = JSON.parse(readFileSync(file, "utf8"));
    config.targetEnvironment = target;
    writeFileSync(file, JSON.stringify(config));
  }
  return { target, files };
}
