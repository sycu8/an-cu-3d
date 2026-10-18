// Unit tests run on Node. The worker tsconfig only loads Cloudflare types.
// @ts-expect-error node builtin is available under vitest
import { execFileSync } from "node:child_process";
// @ts-expect-error node builtin is available under vitest
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
// @ts-expect-error node builtin is available under vitest
import { tmpdir } from "node:os";
// @ts-expect-error node builtin is available under vitest
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildTargetEnvironment, stampBuildEnvironment } from "../../stamp-build-env.mjs";

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function fixture(targetEnvironment: string): string {
  const root = mkdtempSync(path.join(tmpdir(), "ancu-preview-"));
  roots.push(root);
  const workerDir = path.join(root, "dist", "worker");
  mkdirSync(path.join(root, ".wrangler", "deploy"), { recursive: true });
  mkdirSync(workerDir, { recursive: true });
  writeFileSync(
    path.join(root, "wrangler.jsonc"),
    JSON.stringify({
      name: "ancu-property-web",
      main: "src/index.ts",
      compatibility_date: "2026-09-05",
    }),
  );
  writeFileSync(
    path.join(root, ".wrangler", "deploy", "config.json"),
    JSON.stringify({ configPath: "../../dist/worker/wrangler.json", auxiliaryWorkers: [] }),
  );
  writeFileSync(
    path.join(workerDir, "index.js"),
    "export default { fetch() { return new Response('ok'); } };\n",
  );
  writeFileSync(
    path.join(workerDir, "wrangler.json"),
    JSON.stringify({
      name: "ancu-property-web",
      main: "index.js",
      no_bundle: true,
      compatibility_date: "2026-09-05",
      targetEnvironment,
      d1_databases: [
        {
          binding: "DB",
          database_name: "ancu-property-db",
          database_id: "00000000-0000-0000-0000-000000000001",
        },
      ],
      r2_buckets: [{ binding: "ASSETS", bucket_name: "ancu-property-assets" }],
    }),
  );
  return root;
}

function packageRoot(): string {
  const candidates = [process.cwd(), path.join(process.cwd(), "apps/property-web-worker")];
  for (const dir of candidates) {
    if (existsSync(path.join(dir, "stamp-build-env.mjs"))) return dir;
  }
  throw new Error("stamp-build-env.mjs not found");
}

function dryRun(root: string, args: string[]): { status: number; output: string } {
  const wrangler = path.join(packageRoot(), "node_modules/wrangler/bin/wrangler.js");
  try {
    const stdout = execFileSync(process.execPath, [wrangler, "deploy", "--dry-run", ...args], {
      cwd: root,
      env: {
        PATH: process.env.PATH ?? "",
        HOME: process.env.HOME ?? "",
        WRANGLER_SEND_METRICS: "false",
      },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30_000,
    });
    return { status: 0, output: stdout };
  } catch (err) {
    const error = err as { status?: number; stdout?: string; stderr?: string };
    return {
      status: error.status ?? 1,
      output: `${error.stderr ?? ""}\n${error.stdout ?? ""}`,
    };
  }
}

describe("build environment stamp", () => {
  it("runs from the vite build after the worker config is written", () => {
    const source = readFileSync(path.join(packageRoot(), "vite.config.ts"), "utf8");
    expect(source).toContain('stampBuildEnvironment("dist", process.env.CLOUDFLARE_ENV)');
    const deploy = readFileSync(path.join(packageRoot(), "../../docs/deploy.md"), "utf8");
    expect(deploy).toContain("CLOUDFLARE_ENV=preview pnpm build");
  });

  it("stamps a normal build as top-level and a preview build as preview", () => {
    expect(buildTargetEnvironment(undefined)).toBe("top-level");
    expect(buildTargetEnvironment("  ")).toBe("top-level");
    expect(buildTargetEnvironment("preview")).toBe("preview");

    const root = mkdtempSync(path.join(tmpdir(), "ancu-stamp-"));
    roots.push(root);
    const dist = path.join(root, "dist", "worker");
    mkdirSync(dist, { recursive: true });
    const configPath = path.join(dist, "wrangler.json");
    writeFileSync(configPath, JSON.stringify({ name: "ancu-property-web" }));

    expect(stampBuildEnvironment(path.join(root, "dist"), undefined)).toEqual({
      target: "top-level",
      files: [configPath],
    });
    expect(JSON.parse(readFileSync(configPath, "utf8")).targetEnvironment).toBe("top-level");

    stampBuildEnvironment(path.join(root, "dist"), "preview");
    expect(JSON.parse(readFileSync(configPath, "utf8")).targetEnvironment).toBe("preview");
  });

  it("fails wrangler deploy --env preview after a normal build", () => {
    const result = dryRun(fixture("top-level"), ["--env", "preview"]);
    expect(result.status).not.toBe(0);
    expect(result.output).toContain("does not match the target environment");
    expect(result.output).toContain("top-level");
    expect(result.output).not.toContain("--dry-run: exiting now.");
  });

  it("accepts wrangler deploy --env preview after a preview build", () => {
    const result = dryRun(fixture("preview"), ["--env", "preview"]);
    expect(result.output).not.toContain("does not match the target environment");
    expect(result.output).toContain("--dry-run: exiting now.");
    expect(result.status).toBe(0);
  });
});
