import { describe, expect, it } from "vitest";
import { PROJECT_BUILD_STAGES, slugifyProjectName } from "./project-build.js";

describe("project-build helpers", () => {
  it("covers discover→publish pipeline stages", () => {
    expect(PROJECT_BUILD_STAGES).toEqual(
      expect.arrayContaining([
        "discover",
        "crawl",
        "synthesize",
        "assets",
        "floorplans",
        "persist",
        "publish",
        "completed",
        "failed",
      ]),
    );
  });

  it("slugifies Vietnamese project names", () => {
    expect(slugifyProjectName("Vinhomes Grand Park")).toBe("vinhomes-grand-park");
    expect(slugifyProjectName("Eaton Park — Thủ Đức")).toBe("eaton-park-thu-duc");
    expect(slugifyProjectName("Đất Xanh")).toBe("dat-xanh");
  });
});
