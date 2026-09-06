import { describe, expect, it } from "vitest";
import { getProjectBySlug } from "../data/gamuda-projects";
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
    expect(pub.provenance).toBeUndefined();
    expect(pub.name).toContain("Vinhomes");
    expect(pub.developerName).toBeTruthy();
  });

  it("keeps only verified docs / handover / nearby on public detail", () => {
    const raw = getProjectBySlug("vinhomes-grand-park");
    expect(raw).toBeTruthy();
    const pub = toPublicDetail(raw!);
    expect(pub.priceRange).toBe("");
    expect((pub.documents ?? []).every((d) => d.status === "verified")).toBe(true);
    expect((pub.handoverUnits ?? []).length).toBeGreaterThan(0);
    expect(pub.nearbyPlaces.every((p) => p.distanceKm || p.travelTime)).toBe(true);
    expect(pub.apartmentTypes.every((a) => a.confidence == null)).toBe(true);
  });
});
