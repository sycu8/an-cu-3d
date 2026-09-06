#!/usr/bin/env node
/**
 * Post-deploy smoke checks for AnCư 3D Workers.
 * Exits non-zero if health / public blog / admin gate fail.
 *
 * Env:
 *   WEB_BASE_URL      default http://localhost:5173
 *   ENGINE_BASE_URL   default http://localhost:8787
 *   ADMIN_USER        optional — if set with ADMIN_PASSWORD, login smoke runs
 *   ADMIN_PASSWORD    optional
 */

const WEB_BASE_URL = (process.env.WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const ENGINE_BASE_URL = (process.env.ENGINE_BASE_URL ?? "http://localhost:8787").replace(
  /\/$/,
  "",
);
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

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

async function checkStatus(name, url, expected, init) {
  try {
    const response = await fetch(url, init);
    if (response.status === expected) {
      console.log(`✓ ${name}: ${url} → ${response.status}`);
      return true;
    }
    console.error(`✗ ${name}: ${url} → status=${response.status} (expected ${expected})`);
    return false;
  } catch (error) {
    console.error(`✗ ${name}: ${url} → ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function checkBlog() {
  try {
    const response = await fetch(`${WEB_BASE_URL}/api/blog`);
    const body = await response.json();
    if (response.ok && Array.isArray(body?.posts)) {
      console.log(`✓ blog: ${WEB_BASE_URL}/api/blog → ${body.posts.length} posts`);
      return true;
    }
    console.error(`✗ blog: status=${response.status} body=${JSON.stringify(body)}`);
    return false;
  } catch (error) {
    console.error(`✗ blog: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function checkAdminLogin() {
  if (!ADMIN_USER || !ADMIN_PASSWORD) {
    console.log("· admin login smoke skipped (set ADMIN_USER + ADMIN_PASSWORD to enable)");
    return true;
  }
  try {
    const response = await fetch(`${WEB_BASE_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASSWORD }),
    });
    const body = await response.json();
    if (!response.ok) {
      console.error(`✗ admin login: status=${response.status} body=${JSON.stringify(body)}`);
      return false;
    }
    const token = body?.token;
    if (!token) {
      console.error(`✗ admin login: missing token in ${JSON.stringify(body)}`);
      return false;
    }
    const projects = await fetch(`${WEB_BASE_URL}/api/admin/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!projects.ok) {
      console.error(`✗ admin projects: status=${projects.status}`);
      return false;
    }
    console.log("✓ admin login + /api/admin/projects");
    return true;
  } catch (error) {
    console.error(`✗ admin login: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function main() {
  const results = await Promise.all([
    checkHealth("property-web", `${WEB_BASE_URL}/api/health`),
    checkHealth("floorplan-engine", `${ENGINE_BASE_URL}/health`),
    checkStatus("admin unauthorized", `${WEB_BASE_URL}/api/admin/projects`, 401),
    checkBlog(),
    checkAdminLogin(),
  ]);

  if (!results.every(Boolean)) {
    process.exit(1);
  }
  console.log("Smoke OK");
}

main();
