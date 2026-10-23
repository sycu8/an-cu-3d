/** Shared Vietnamese and English copy for the static head, FAQ, and footer. */

export const CANONICAL_ORIGIN = "https://home.orangecloud.vn";
export const CANONICAL_HOST = "home.orangecloud.vn";
export const HUB_ORIGIN = "https://orangecloud.vn";
export const PERSON_ID = "https://orangecloud.vn/#person";

export const SITE_TITLE = "AnCư 3D — Hiểu căn nhà trước khi gọi là nhà";
export const SITE_DESCRIPTION =
  "Hiểu căn nhà trước khi gọi là nhà — mặt bằng có nhãn tin cậy, không gian 3D và so sánh theo tiêu chí của bạn. Understand the home before you call it home.";
export const H1 = "Hiểu căn nhà trước khi gọi là nhà.";

/** Social card in public/, drawn from the local cover SVG and the seed floor plan. */
export const OG_IMAGE_PATH = "/og-image.png";
export const OG_IMAGE_URL = `${CANONICAL_ORIGIN}${OG_IMAGE_PATH}`;
export const OG_IMAGE_ALT = "AnCư 3D — mặt bằng minh họa. Hiểu căn nhà trước khi gọi là nhà.";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const HUB_LINKS = [
  { href: "https://orangecloud.vn/", label: "Trang chủ Orange Cloud" },
  { href: "https://onboarding.orangecloud.vn/", label: "Onboarding" },
  { href: "https://ready.orangecloud.vn/", label: "CF Ready" },
  { href: "https://blog.orangecloud.vn/", label: "Insights" },
] as const;

export const FAQ = [
  {
    qVi: "AnCư 3D dùng để làm gì?",
    aVi: "Để hiểu một căn nhà trước khi quyết định. Bạn xem mặt bằng có nhãn tin cậy, đi trong không gian 3D, rồi so sánh vài dự án theo điều bạn thực sự cần. Số liệu chưa có nguồn thì ghi là chờ xác minh.",
    qEn: "What is AnCư 3D for?",
    aEn: "It helps you understand a home before you decide. You can read a floor plan with a trust label, walk the space in 3D, and compare a few projects against what you actually need. Figures without a source stay marked as awaiting verification.",
  },
  {
    qVi: "Giá và diện tích trên trang có phải số của chủ đầu tư không?",
    aVi: "Chỉ khi có nguồn. Giá, diện tích và ngày bàn giao không rõ nguồn sẽ không hiện như sự thật. Mặt bằng mẫu được ghi là minh họa cho đến khi có hồ sơ đã đối chiếu.",
    qEn: "Are prices and areas the developer's official figures?",
    aEn: "Only when a source is attached. Prices, areas, and handover dates without a source are not shown as facts. Sample floor plans stay labeled as illustrative until a checked document exists.",
  },
  {
    qVi: "Trang này thuộc đâu?",
    aVi: "AnCư 3D chạy tại home.orangecloud.vn, trong showcase cá nhân Orange Cloud. Tác giả và nhà xuất bản là Cường Lê Sỹ. Đây không phải trang của Cloudflare, Inc.",
    qEn: "Where does this site sit?",
    aEn: "AnCư 3D runs at home.orangecloud.vn, inside the personal Orange Cloud showcase. The author and publisher is Cường Lê Sỹ. It is not a Cloudflare, Inc. site.",
  },
] as const;
