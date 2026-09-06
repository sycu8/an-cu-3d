export type AmenityCategory =
  | "education"
  | "hospital"
  | "shopping"
  | "park"
  | "restaurant"
  | "transport"
  | "business_district"
  | "airport";

export const AMENITY_CATEGORIES: { id: AmenityCategory; label: string }[] = [
  { id: "education", label: "Giáo dục" },
  { id: "hospital", label: "Y tế" },
  { id: "shopping", label: "Mua sắm" },
  { id: "park", label: "Công viên" },
  { id: "restaurant", label: "Ẩm thực" },
  { id: "transport", label: "Giao thông" },
  { id: "business_district", label: "Khu kinh doanh" },
  { id: "airport", label: "Sân bay" },
];
