import { describe, expect, it } from "vitest";
import { getProjectBySlug } from "../data/gamuda-projects";
import { resolveFloorPlanForUnit } from "../data/sample-floorplans";
import {
  isPendingValue,
  isSecondaryMarketPrice,
  toPublicDetail,
  toPublicSummary,
} from "./public-project";

describe("public-project buyer gate", () => {
  it("treats pending labels as unverified", () => {
    expect(isPendingValue("Chờ xác minh")).toBe(true);
    expect(isPendingValue("Chờ xác minh — thiếu nguồn CĐT")).toBe(true);
    expect(isPendingValue("Đã bàn giao 2020")).toBe(false);
  });

  it("detects secondary-market price research labels", () => {
    expect(
      isSecondaryMarketPrice(
        "Tham chiếu TT thứ cấp (không phải bảng giá CĐT): phổ biến khoảng 45–75 tr/m²",
      ),
    ).toBe(true);
    expect(isSecondaryMarketPrice("Từ 45 triệu/m² (bảng giá CĐT)")).toBe(false);
  });

  it("strips secondary price and confidence from public summary", () => {
    const raw = getProjectBySlug("vinhomes-grand-park");
    expect(raw).toBeTruthy();
    const pub = toPublicSummary(raw!);
    expect(pub.priceRange).toBe("");
    expect(pub.priceProvenance).toBeUndefined();
    expect(pub.confidence).toBeUndefined();
    expect(pub.provenance).toMatch(/xác minh|tham khảo|dữ liệu/i);
    expect(pub.name).toContain("Vinhomes");
    expect(pub.developerName).toBeTruthy();
  });

  it("keeps apartment typologies with floorplan verification labels", () => {
    const raw = getProjectBySlug("vinhomes-grand-park");
    expect(raw).toBeTruthy();
    const pub = toPublicDetail(raw!);
    expect(pub.priceRange).toBe("");
    expect((pub.documents ?? []).every((d) => d.status === "verified")).toBe(true);
    expect((pub.handoverUnits ?? []).length).toBeGreaterThan(0);
    expect(pub.apartmentTypes.length).toBeGreaterThanOrEqual(3);
    expect(pub.apartmentTypes.every((a) => a.confidence == null)).toBe(true);
    expect(pub.apartmentTypes.every((a) => a.floorplanVerification)).toBe(true);

    const threeBr = pub.apartmentTypes.find((a) => a.bedrooms === 3);
    expect(threeBr?.floorplanVerification).toBe("unknown");
    expect(threeBr?.floorplanKey).toBeUndefined();

    const twoBr = pub.apartmentTypes.find((a) => a.bedrooms === 2);
    expect(twoBr?.floorplanVerification).toBe("illustrative");
  });

  it("never resolves a 3BR unit to 2BR sample geometry", () => {
    const resolved = resolveFloorPlanForUnit({
      floorplanKey: "2br-c",
      unitSlug: "3br",
      bedrooms: 3,
    });
    expect(resolved.document).toBeNull();
    expect(resolved.verificationStatus).toBe("illustrative");

    const unknown = resolveFloorPlanForUnit({
      floorplanKey: undefined,
      unitSlug: "3br",
      bedrooms: 3,
    });
    expect(unknown.document).toBeNull();
    expect(unknown.verificationStatus).toBe("unknown");
  });
});
