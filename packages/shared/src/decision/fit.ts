/**
 * Deterministic "Does this unit fit me?" assessment.
 */

import { evaluateFurnitureFit } from "../furniture/fit.js";
import type { Vec2 } from "../geometry/vec2.js";
import {
  preferredBedrooms,
  type HouseholdProfile,
  type LifestylePreferences,
  type WfhCount,
} from "./preferences.js";

export type FitComponentKey = "space" | "layout" | "wfh" | "storage";

export interface FitComponent {
  key: FitComponentKey;
  labelVi: string;
  score: number | null;
  explainVi: string;
}

export interface UnitFitAssessment {
  overall: number | null;
  sufficient: boolean;
  components: FitComponent[];
  explainVi: string;
  recommendationsVi: string[];
}

export interface UnitFitInput {
  preferences: Pick<LifestylePreferences, "household" | "wfh" | "vehicle">;
  bedrooms?: number | null;
  bathrooms?: number | null;
  rooms?: Array<{
    id: string;
    type?: string;
    name?: string;
    polygon: Vec2[];
    areaSqM?: number;
  }>;
  layoutEfficiency?: number | null;
  floorplanVerified?: boolean;
}

function householdLabel(h: HouseholdProfile): string {
  switch (h) {
    case "solo":
      return "một mình";
    case "couple":
      return "cặp đôi";
    case "family_1_child":
      return "gia đình 1 bé";
    case "family_2_children":
      return "gia đình 2 bé";
  }
}

function bedroomComponent(
  bedrooms: number | null | undefined,
  household: HouseholdProfile,
): FitComponent {
  if (bedrooms == null || !Number.isFinite(bedrooms)) {
    return {
      key: "space",
      labelVi: "Số phòng ngủ",
      score: null,
      explainVi: "Chưa có số phòng ngủ đã xác minh.",
    };
  }
  const target = preferredBedrooms(household);
  if (bedrooms >= target) {
    return {
      key: "space",
      labelVi: "Số phòng ngủ",
      score: bedrooms === target ? 1 : 0.9,
      explainVi:
        bedrooms === target
          ? `${bedrooms} PN khớp nhu cầu hộ ${householdLabel(household)}.`
          : `${bedrooms} PN rộng hơn nhu cầu tối thiểu (${target} PN).`,
    };
  }
  if (bedrooms === target - 1) {
    return {
      key: "space",
      labelVi: "Số phòng ngủ",
      score: 0.55,
      explainVi: `${bedrooms} PN hơi thiếu so với nhu cầu khoảng ${target} PN.`,
    };
  }
  return {
    key: "space",
    labelVi: "Số phòng ngủ",
    score: 0.25,
    explainVi: `${bedrooms} PN thấp hơn nhu cầu khoảng ${target} PN.`,
  };
}

function furnitureNeeds(household: HouseholdProfile, wfh: WfhCount): string[] {
  const ids: string[] = [];
  ids.push(household === "solo" || household === "couple" ? "bed-queen" : "bed-king");
  ids.push(household === "solo" ? "sofa-2seat" : "sofa-3seat");
  if (wfh > 0) ids.push("desk");
  if (household !== "solo") ids.push("wardrobe");
  return ids;
}

function layoutComponent(input: UnitFitInput): FitComponent {
  const rooms = input.rooms ?? [];
  if (!input.floorplanVerified || rooms.length === 0) {
    return {
      key: "layout",
      labelVi: "Bố trí nội thất",
      score: null,
      explainVi: "Chưa đủ mặt bằng đã xác minh để kiểm tra nội thất.",
    };
  }

  const needs = furnitureNeeds(input.preferences.household, input.preferences.wfh);
  const bedrooms = rooms.filter((r) => r.type === "bedroom");
  const living = rooms.filter((r) => r.type === "living");
  let comfortable = 0;
  let total = 0;
  const notes: string[] = [];

  for (const id of needs) {
    const candidates =
      id.startsWith("bed") || id === "wardrobe" || id === "desk"
        ? bedrooms.length
          ? bedrooms
          : rooms
        : living.length
          ? living
          : rooms;
    let best: "comfortable" | "tight" | "does_not_fit" | null = null;
    for (const room of candidates) {
      const fit = evaluateFurnitureFit({ room, furnitureId: id });
      if (!fit) continue;
      if (
        !best ||
        (fit.verdict === "comfortable" && best !== "comfortable") ||
        (fit.verdict === "tight" && best === "does_not_fit")
      ) {
        best = fit.verdict;
      }
      if (fit.verdict === "comfortable") break;
    }
    if (best) {
      total += 1;
      if (best === "comfortable") comfortable += 1;
      else if (best === "tight") comfortable += 0.5;
      else notes.push(`${id} không vừa`);
    }
  }

  if (total === 0) {
    return {
      key: "layout",
      labelVi: "Bố trí nội thất",
      score: null,
      explainVi: "Không đánh giá được bố trí từ hình học hiện có.",
    };
  }

  return {
    key: "layout",
    labelVi: "Bố trí nội thất",
    score: Math.round((comfortable / total) * 100) / 100,
    explainVi: `${comfortable}/${total} nhu cầu nội thất vừa ở mức thoải mái hoặc chấp nhận được.${
      notes.length ? ` ${notes.join("; ")}.` : ""
    }`,
  };
}

function wfhComponent(input: UnitFitInput): FitComponent {
  const wfh = input.preferences.wfh;
  if (wfh === 0) {
    return {
      key: "wfh",
      labelVi: "Làm việc tại nhà",
      score: 1,
      explainVi: "Không yêu cầu chỗ làm việc tại nhà.",
    };
  }
  const rooms = input.rooms ?? [];
  if (!input.floorplanVerified || rooms.length === 0) {
    const beds = input.bedrooms;
    if (beds == null) {
      return {
        key: "wfh",
        labelVi: "Làm việc tại nhà",
        score: null,
        explainVi: "Chưa đủ dữ liệu để đánh giá chỗ WFH.",
      };
    }
    const score = beds >= wfh + 1 ? 0.75 : beds >= wfh ? 0.5 : 0.3;
    return {
      key: "wfh",
      labelVi: "Làm việc tại nhà",
      score,
      explainVi: `Ước lượng từ số PN (${beds}) cho ${wfh} người WFH — chưa có mặt bằng xác minh.`,
    };
  }

  const deskRooms = rooms.filter(
    (r) => r.type === "bedroom" || r.type === "other" || r.type === "living",
  );
  let desksOk = 0;
  for (const room of deskRooms) {
    const fit = evaluateFurnitureFit({ room, furnitureId: "desk" });
    if (fit && fit.verdict !== "does_not_fit") desksOk += 1;
  }
  return {
    key: "wfh",
    labelVi: "Làm việc tại nhà",
    score: Math.min(1, desksOk / wfh),
    explainVi: `Có khoảng ${desksOk} vị trí có thể đặt bàn làm việc cho nhu cầu ${wfh} người.`,
  };
}

function storageComponent(input: UnitFitInput): FitComponent {
  const rooms = input.rooms ?? [];
  if (rooms.length > 0 && input.floorplanVerified) {
    const hasStorage = rooms.some((r) => r.type === "storage");
    return {
      key: "storage",
      labelVi: "Lưu trữ",
      score: hasStorage ? 1 : input.bedrooms && input.bedrooms >= 2 ? 0.55 : 0.35,
      explainVi: hasStorage
        ? "Có phòng/kho lưu trữ trên mặt bằng."
        : "Không thấy kho riêng — dựa vào tủ trong phòng ngủ.",
    };
  }
  if (input.bedrooms == null) {
    return {
      key: "storage",
      labelVi: "Lưu trữ",
      score: null,
      explainVi: "Chưa đủ dữ liệu lưu trữ.",
    };
  }
  return {
    key: "storage",
    labelVi: "Lưu trữ",
    score: input.bedrooms >= 2 ? 0.5 : 0.35,
    explainVi: "Ước lượng sơ bộ từ số phòng ngủ — chưa có mặt bằng xác minh.",
  };
}

export function assessUnitFit(input: UnitFitInput): UnitFitAssessment {
  const components: FitComponent[] = [
    bedroomComponent(input.bedrooms, input.preferences.household),
    layoutComponent(input),
    wfhComponent(input),
    storageComponent(input),
  ];

  if (input.layoutEfficiency != null && Number.isFinite(input.layoutEfficiency)) {
    const efficiency = Math.min(1, Math.max(0, input.layoutEfficiency));
    const layout = components.find((c) => c.key === "layout");
    if (layout?.score != null) {
      layout.score = Math.round(((layout.score + efficiency) / 2) * 100) / 100;
      layout.explainVi += ` Hiệu quả mặt bằng ${(efficiency * 100).toFixed(0)}%.`;
    } else if (layout) {
      layout.score = efficiency;
      layout.explainVi = `Hiệu quả mặt bằng ${(efficiency * 100).toFixed(0)}%.`;
    }
  }

  const scored = components.filter((c) => c.score != null);
  if (scored.length < 2) {
    return {
      overall: null,
      sufficient: false,
      components,
      explainVi: "Chưa đủ dữ liệu để đánh giá mức độ phù hợp.",
      recommendationsVi: [
        "Chọn loại căn có số phòng ngủ rõ ràng",
        "Chờ mặt bằng đã xác minh để kiểm tra nội thất",
      ],
    };
  }

  const overall = Math.round(
    (scored.reduce((s, c) => s + (c.score as number), 0) / scored.length) * 100,
  );

  const recommendationsVi: string[] = [];
  const space = components.find((c) => c.key === "space");
  if (space?.score != null && space.score < 0.6) {
    recommendationsVi.push("Cân nhắc loại căn có thêm phòng ngủ");
  }
  if (input.preferences.wfh > 0) {
    recommendationsVi.push(
      "Kiểm tra góc làm việc trong phòng ngủ hoặc phòng đa năng",
    );
  }
  if (input.preferences.vehicle === "car") {
    recommendationsVi.push(
      "Xác minh chỗ đậu xe / phí giữ xe với CĐT (chưa có trong dữ liệu này)",
    );
  }

  return {
    overall,
    sufficient: true,
    components,
    explainVi: `Mức phù hợp ước tính ${overall}/100 từ ${scored.length} tiêu chí có dữ liệu — không thay thế khảo sát thực tế.`,
    recommendationsVi,
  };
}
