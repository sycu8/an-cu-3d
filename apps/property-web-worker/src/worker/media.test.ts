import { describe, expect, it, vi } from "vitest";
import { mediaUrl, isSafeR2Key, normalizeR2Key, resolveCoverUrl } from "@ancu/shared";
import { serveMedia, withMediaUrl } from "./media";
import type { Env } from "./types";

describe("shared media helpers", () => {
  it("builds media URLs with variants", () => {
    expect(mediaUrl("projects/a/cover.jpg", { variant: "card", format: "webp" })).toBe(
      "/api/media/projects/a/cover.jpg?v=card&f=webp",
    );
  });

  it("rejects unsafe keys and strips empty segments", () => {
    expect(isSafeR2Key("../etc/passwd")).toBe(false);
    expect(isSafeR2Key("projects/ok/cover.jpg")).toBe(true);
    // Implementation drops "." / ".." tokens rather than resolving paths.
    expect(normalizeR2Key("/projects/./x/../y")).toBe("projects/x/y");
  });

  it("resolves cover preferring R2", () => {
    expect(resolveCoverUrl(null, "projects/a/c.jpg", "/fallback")).toContain(
      "/api/media/projects/a/c.jpg",
    );
    expect(resolveCoverUrl("https://cdn.example/a.jpg", "k", "/fallback")).toBe(
      "https://cdn.example/a.jpg",
    );
  });
});

describe("withMediaUrl", () => {
  it("adds url for r2Key", () => {
    expect(withMediaUrl({ r2Key: "media/x.jpg", note: "ok" }).url).toContain(
      "/api/media/media/x.jpg",
    );
  });
});

describe("serveMedia", () => {
  it("returns 400 for unsafe key", async () => {
    const env = { ASSETS: { get: vi.fn() } } as unknown as Env;
    const res = await serveMedia(
      new Request("http://localhost/api/media/foo%2F..%2Fsecret"),
      env,
      "req-1",
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when object missing", async () => {
    const env = {
      ASSETS: { get: vi.fn().mockResolvedValue(null) },
    } as unknown as Env;
    const res = await serveMedia(
      new Request("http://localhost/api/media/projects/missing.jpg"),
      env,
      "req-2",
    );
    expect(res.status).toBe(404);
  });

  it("streams R2 object bytes", async () => {
    const body = new Uint8Array([1, 2, 3]);
    const env = {
      ASSETS: {
        get: vi.fn().mockResolvedValue({
          body,
          size: 3,
          httpEtag: '"abc"',
          httpMetadata: { contentType: "image/jpeg" },
        }),
      },
    } as unknown as Env;

    const res = await serveMedia(
      new Request("http://localhost/api/media/projects/a.jpg"),
      env,
      "req-3",
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    expect(res.headers.get("X-Images")).toBe("raw");
    expect((await res.arrayBuffer()).byteLength).toBe(3);
  });
});
