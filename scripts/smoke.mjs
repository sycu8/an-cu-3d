#!/usr/bin/env node
/**
 * Post-deploy smoke checks for AnCư 3D Workers.
 * Exits non-zero if health endpoints do not return { status: "ok" }.
 */

const WEB_BASE_URL = (process.env.WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const ENGINE_BASE_URL = (process.env.ENGINE_BASE_URL ?? "http://localhost:8787").replace(/\/$/, "");

async function checkHealth(name, url) {
  try {
    const response = await fetch(url);
    const body = await response.json();
    if (response.ok && body?.status === "ok") {
      console.log(`✓ ${name}: ${url} → ok`);
      return true;
    }
    console.error(`✗ ${name}: ${url} → status=${response.status} body=${JSON.stringify(body)}`);
    return false;
  } catch (error) {
    console.error(`✗ ${name}: ${url} → ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function main() {
  const results = await Promise.all([
    checkHealth("property-web", `${WEB_BASE_URL}/api/health`),
    checkHealth("floorplan-engine", `${ENGINE_BASE_URL}/health`),
  ]);

  if (!results.every(Boolean)) {
    process.exit(1);
  }
}

main();
