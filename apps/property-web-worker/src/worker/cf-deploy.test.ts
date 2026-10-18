// Unit tests run on Node. The worker tsconfig only loads Cloudflare types.
// @ts-expect-error node builtin is available under vitest
import { execFileSync } from "node:child_process";
// @ts-expect-error node builtin is available under vitest
import { existsSync } from "node:fs";
// @ts-expect-error node builtin is available under vitest
import path from "node:path";
import { describe, expect, it } from "vitest";

function repoRoot(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), "../..")];
  for (const dir of candidates) {
    if (existsSync(path.join(dir, "scripts/cf-deploy.sh"))) return dir;
  }
  throw new Error("scripts/cf-deploy.sh not found");
}

function runDeploy(secret: string): { status: number; stderr: string } {
  try {
    execFileSync("bash", ["scripts/cf-deploy.sh"], {
      cwd: repoRoot(),
      env: {
        PATH: process.env.PATH ?? "",
        CLOUDFLARE_API_TOKEN: "test-token",
        CLOUDFLARE_ACCOUNT_ID: "test-account",
        ENGINE_API_SECRET: secret,
      },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5_000,
    });
    return { status: 0, stderr: "" };
  } catch (err) {
    const error = err as { status?: number; stderr?: string };
    return { status: error.status ?? 1, stderr: String(error.stderr ?? "") };
  }
}

describe("cf-deploy ENGINE_API_SECRET fail-fast", () => {
  it.each([
    ["empty", ""],
    ["whitespace", " \n"],
    ["31 characters", "a".repeat(31)],
    ["trailing newline", `${"b".repeat(32)}\n`],
    ["tab", `${"e".repeat(16)}\t${"e".repeat(16)}`],
    ["crlf", `${"f".repeat(32)}\r\n`],
    ["leading space", ` ${"c".repeat(32)}`],
    ["internal space", `${"d".repeat(16)} ${"d".repeat(15)}`],
    ["non-ascii", `${"g".repeat(31)}é`],
  ])("exits before deploy when the secret is %s", (_label, secret) => {
    const result = runDeploy(secret);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("ENGINE_API_SECRET");
    expect(result.stderr).not.toContain("Deploying property web");
    expect(result.stderr).not.toContain("token_urlsafe");
  });
});

describe("require-engine-secret", () => {
  function runCheck(secret: string): { status: number; stderr: string } {
    try {
      execFileSync("bash", ["scripts/require-engine-secret.sh"], {
        cwd: repoRoot(),
        env: {
          PATH: process.env.PATH ?? "",
          ENGINE_API_SECRET: secret,
        },
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 5_000,
      });
      return { status: 0, stderr: "" };
    } catch (err) {
      const error = err as { status?: number; stderr?: string };
      return { status: error.status ?? 1, stderr: String(error.stderr ?? "") };
    }
  }

  it("accepts a 32-character printable ASCII secret", () => {
    const secret = "Aa1!".repeat(8);
    const result = runCheck(secret);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stderr).not.toContain(secret);
  });

  it("rejects a tab, a CRLF, and a non-ascii character", () => {
    for (const secret of [`${"e".repeat(16)}\t${"e".repeat(15)}`, `${"f".repeat(30)}\r\n`, `${"g".repeat(31)}é`]) {
      const result = runCheck(secret);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("ENGINE_API_SECRET");
      expect(result.stderr).not.toContain(secret);
    }
  });
});
