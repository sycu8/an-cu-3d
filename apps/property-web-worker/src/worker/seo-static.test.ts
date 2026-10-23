import { describe, expect, it } from "vitest";
import { isSpaRoute } from "./seo-static";

describe("spa route matching", () => {
  it("accepts app routes and rejects unknown paths", () => {
    expect(isSpaRoute("/")).toBe(true);
    expect(isSpaRoute("/projects/")).toBe(true);
    expect(isSpaRoute("/projects/vinhomes-grand-park/showroom")).toBe(true);
    expect(isSpaRoute("/blog/nhin-gan-du-an-dang-co-tren-ancu")).toBe(true);
    expect(isSpaRoute("/tools/loan")).toBe(true);
    expect(isSpaRoute("/admin")).toBe(true);
    expect(isSpaRoute("/robots.txt")).toBe(false);
    expect(isSpaRoute("/khong-co")).toBe(false);
    expect(isSpaRoute("/projects/a/b/c")).toBe(false);
    expect(isSpaRoute("/blog/a/b")).toBe(false);
    expect(isSpaRoute("/projects/../admin")).toBe(false);
  });
});
