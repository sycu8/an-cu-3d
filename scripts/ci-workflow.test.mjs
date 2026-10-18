/**
 * Guards .github/workflows/ci.yml so feature-branch pushes cannot deploy.
 * Run via @ancu/shared's test script (node:test, no extra dependencies).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ci = readFileSync(resolve(root, ".github/workflows/ci.yml"), "utf8");
const deployWorkflow = readFileSync(resolve(root, ".github/workflows/deploy.yml"), "utf8");

function jobBody(name) {
  const marker = `\n  ${name}:\n`;
  const start = ci.indexOf(marker);
  assert.notEqual(start, -1, `job ${name} missing`);
  const rest = ci.slice(start + marker.length);
  const next = rest.search(/\n  [a-zA-Z0-9_-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
}

test("keeps the build and deploy job names", () => {
  assert.match(ci, /^jobs:\n {2}build:\n/m);
  assert.match(ci, /\n {2}deploy:\n/);
  assert.doesNotMatch(ci, /^\s*environment:/m);
});

test("deploy job runs only on main, and a manual run must opt in", () => {
  const deploy = jobBody("deploy");
  assert.match(
    deploy,
    /if: github\.ref == 'refs\/heads\/main' && \(github\.event_name == 'push' \|\| \(github\.event_name == 'workflow_dispatch' && inputs\.deploy == true\)\)/,
  );
  assert.match(deploy, /scripts\/cf-deploy\.sh/);
  assert.doesNotMatch(deploy, /cursor/);
  assert.doesNotMatch(deploy, /--dry-run/);
});

test("pull requests and other branches build and test, and dry-run at most", () => {
  const build = jobBody("build");
  assert.match(ci, /pull_request:/);
  const executable = build
    .split("\n")
    .filter((line) => !line.trim().startsWith("#"))
    .join("\n");
  assert.match(executable, /pnpm -r run typecheck/);
  assert.match(executable, /pnpm -r run test/);
  assert.match(executable, /pnpm -r run build/);
  assert.doesNotMatch(executable, /cf-deploy\.sh/);
  assert.doesNotMatch(executable, /wrangler secret put/);
  assert.doesNotMatch(executable, /d1 migrations apply/);

  const wranglerLines = executable.split("\n").filter((line) => line.includes("wrangler"));
  assert.ok(wranglerLines.length > 0, "expected a wrangler dry-run on non-production runs");
  for (const line of wranglerLines) {
    assert.match(line, /wrangler deploy --dry-run/);
    assert.doesNotMatch(line, /wrangler deploy(?! --dry-run)/);
  }

  assert.match(
    build,
    /github\.event_name == 'pull_request' \|\| \(github\.event_name == 'push' && github\.ref != 'refs\/heads\/main'\)/,
  );
});

test("keeps the workflow_dispatch deploy input and Cloudflare secret names", () => {
  assert.match(ci, /workflow_dispatch:/);
  assert.match(ci, /description: "Also deploy to Cloudflare"/);
  assert.match(ci, /type: boolean/);
  assert.match(ci, /default: false/);
  assert.doesNotMatch(ci, /default: true/);

  const secrets = [
    "CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}",
    "CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}",
    "CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}",
    "CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}",
    "API_TOKEN: ${{ secrets.API_TOKEN }}",
    "ACCOUNT_ID: ${{ secrets.ACCOUNT_ID }}",
    "ENGINE_API_SECRET: ${{ secrets.ENGINE_API_SECRET }}",
  ];
  const deploy = jobBody("deploy");
  for (const line of secrets) {
    assert.ok(deploy.includes(line), `missing ${line}`);
  }
  assert.equal(deploy.match(/secrets\./g)?.length, secrets.length);
});

test("deploy.yml deploys only from main and does not pre-fill confirm", () => {
  assert.match(deployWorkflow, /description: "Type deploy to confirm"/);
  assert.match(deployWorkflow, /required: true/);
  assert.doesNotMatch(deployWorkflow, /default:\s*deploy/);
  assert.match(
    deployWorkflow,
    /if: github\.ref == 'refs\/heads\/main' && \(github\.event_name == 'push' \|\| github\.event\.inputs\.confirm == 'deploy'\)/,
  );
  assert.match(deployWorkflow, /\n {2}deploy:\n/);
  assert.doesNotMatch(deployWorkflow, /^\s*environment:/m);

  const secrets = [
    "CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}",
    "CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}",
    "CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}",
    "CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}",
    "API_TOKEN: ${{ secrets.API_TOKEN }}",
    "ACCOUNT_ID: ${{ secrets.ACCOUNT_ID }}",
    "ENGINE_API_SECRET: ${{ secrets.ENGINE_API_SECRET }}",
  ];
  for (const line of secrets) {
    assert.ok(deployWorkflow.includes(line), `missing ${line}`);
  }
});
