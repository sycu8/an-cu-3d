import type { BlogPost } from "@ancu/shared";

/**
 * Curated public posts. No weekly backlog or draft queue existed in
 * agent-state, QA notes, or D1 seeds — these topics explain the product
 * using facts already on the catalog.
 *
 * They ship in the worker. On a blog read, missing slugs are inserted into
 * D1 as published. An existing row (including archived) is left alone.
 */

const LOCALE = "vi";

function post(input: {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyMarkdown: string;
  projectSlugs: string[];
  seoTitle: string;
  seoDescription: string;
  publishedAt: string;
}): BlogPost {
  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    bodyMarkdown: input.bodyMarkdown.trim(),
    coverR2Key: null,
    coverUrl: null,
    projectSlugs: input.projectSlugs,
    status: "published",
    locale: LOCALE,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    publishedAt: input.publishedAt,
    createdAt: input.publishedAt,
    updatedAt: input.publishedAt,
  };
}

export const EDITORIAL_BLOG_POSTS: BlogPost[] = [
  post({
    id: "blog_editorial_cho_xac_minh",
    slug: "cho-xac-minh-khong-phai-o-trong",
    title: "“Chờ xác minh” không phải ô trống",
    excerpt:
      "Khi AnCư chưa có nguồn cho giá, diện tích hay thời gian đi đường, ô đó đứng yên. Không điền một con số cho đủ bảng.",
    seoTitle: "Chờ xác minh không phải ô trống | Blog AnCư",
    seoDescription:
      "AnCư giữ giá, diện tích và thời gian di chuyển ở trạng thái Chờ xác minh khi chưa có nguồn — không điền số cho đủ bảng.",
    publishedAt: "2026-10-04 09:00:00",
    projectSlugs: ["eaton-park", "celadon-city"],
    bodyMarkdown: `
## Câu đó nghĩa là chưa có căn cứ

AnCư 3D dùng **Chờ xác minh** cho trường đã có trên hồ sơ nhưng chưa đủ nguồn để ghi số hay mốc. Đó không phải chỗ trống chờ người xem tự điền, và cũng không phải cách nói tránh của “sắp có giá”.

Câu ở trang chủ là hiểu căn nhà trước khi gọi là nhà. Chỗ chưa biết phải để người đọc thấy là chưa biết.

## Nhãn người xem gặp trên trang

Huy hiệu tin cậy dùng vài câu ngắn, đúng việc:

- **Đã xác minh** — có nguồn công khai đã gắn
- **Dữ liệu tham khảo** — dùng để tham khảo, cần đối chiếu trước giao dịch
- **Chờ xác minh** — chưa đủ dữ liệu để khẳng định
- **Minh họa** — hình để hiểu bố cục, không phải hồ sơ chính thức
- **Chưa đủ dữ liệu** — không suy ra thêm

Giá chủ đầu tư, diện tích từng căn, ngày bàn giao từng block, và thời gian di chuyển là những chỗ hay đứng ở chờ xác minh. [Eaton Park](/projects/eaton-park) là ví dụ: khu vực Thủ Đức và tên chủ đầu tư có trên hồ sơ, còn địa chỉ, giá, quy mô và bàn giao thì chưa.

## Khoảng cách không biến thành số phút

Bản đồ chỉ kẻ đường chim bay khi cả dự án và điểm đến có tọa độ. Thiếu tọa độ thì điểm đó không được vẽ thêm. Chưa có động cơ định tuyến được cấp phép thì dòng thời gian ở trạng thái chưa cấu hình — không phải “không phút”, không phải “rất gần”.

## Mặt bằng minh họa không phải bảng hàng

Trong trình xem, mặt bằng chưa có FloorPlanDocument công bố khớp loại căn được gắn minh họa hoặc ước lượng. Mặt bằng hai phòng ngủ không được đem ra minh họa căn ba phòng ngủ. [Celadon City](/projects/celadon-city) có cư dân và một vài tiện ích đã liệt kê; diện tích và giá từng loại căn vẫn chờ bảng chủ đầu tư.

Trang so sánh nhận tối đa ba dự án. Tiêu chí thiếu số liệu bị bỏ qua khi chấm, không được thay bằng một điểm giả.

## Đừng điền giúp

Đừng lấy ô chờ xác minh rồi viết một khoảng giá “cho dễ so”. Đừng đọc thời gian đi đường còn trống thành lợi thế vị trí. Đừng dùng mặt bằng minh họa làm căn cứ chốt căn.

> Giá, diện tích và thời gian di chuyển chưa có nguồn thì giữ nguyên “Chờ xác minh”.
`,
  }),
  post({
    id: "blog_editorial_showroom",
    slug: "showroom-anh-sang-vat-lieu-diem-nong",
    title: "Đi một vòng showroom: ánh sáng, vật liệu, điểm nóng",
    excerpt:
      "Showroom để xem một căn dưới vài kiểu sáng và vài bảng vật liệu, rồi gửi đúng đường link đó. Không phải ảnh bàn giao.",
    seoTitle: "Showroom: ánh sáng, vật liệu, điểm nóng | AnCư",
    seoDescription:
      "Cách dùng showroom AnCư: ba kiểu ánh sáng, ba bảng vật liệu, điểm nóng từng phòng và đường link chia sẻ. Mô hình, không phải ảnh bàn giao.",
    publishedAt: "2026-10-08 09:00:00",
    projectSlugs: ["celadon-city", "vinhomes-grand-park"],
    bodyMarkdown: `
## Xem căn, không rao căn

Showroom là chỗ xem một căn theo mô hình: đổi ánh sáng, đổi bảng vật liệu, bấm điểm nóng để đứng vào một phòng. Ảnh và phối cảnh, nếu dự án có, vẫn cần đối chiếu với chủ đầu tư trước khi dùng làm căn cứ bán hàng. Trang showroom ghi điều đó ngay trên màn hình.

Hai chỗ có thể mở ngay: [showroom Celadon City](/projects/celadon-city/showroom) và [showroom Vinhomes Grand Park](/projects/vinhomes-grand-park/showroom).

## Ba kiểu ánh sáng

Đường dẫn giữ lựa chọn của bạn. Ba mức đang có tên **Ban ngày**, **Hoàng hôn** và **Buổi tối**. Chưa chọn thì trang dùng mặc định của dự án — ban ngày, nếu hồ sơ không khai báo kiểu sáng khác.

Đổi sáng không đổi diện tích, không đổi giá. Nó chỉ cho thấy cùng một khối căn dưới ba điều kiện sáng khác nhau.

## Ba bảng vật liệu

Bảng mặc định là **Ivory ấm**, **Teal hiện đại** và **Clay ấm**. Nếu hồ sơ dự án có màu rút từ ảnh thật, danh sách thêm một lựa chọn từ ảnh đó. Đường link ghi tên bảng, nên người nhận mở đúng lựa chọn chứ không phụ thuộc một ảnh chụp màn hình.

## Điểm nóng và đường link

Điểm nóng gắn với phòng trên mặt bằng đang mở, để kéo tầm nhìn về phòng đó. Link chia sẻ mang slug dự án, và khi bạn đã chọn thì giữ căn, kiểu sáng và bảng vật liệu. Người nhận mở lại đúng trạng thái đó, không cần một ảnh chụp màn hình.

## Mặt bằng phải khớp loại căn

Trình xem chỉ nhận mặt bằng khi loại căn khớp. Trạng thái minh họa hoặc ước lượng được gắn nhãn trên trang: đó là sơ đồ để hiểu bố cục, chưa phải hồ sơ bán hàng đã đối chiếu từng mét. Giá và diện tích chỉ mang tính minh họa khi dữ liệu còn chờ xác minh.

> Showroom để gửi một đường link. Nó không thay bảng giá hay biên bản bàn giao.
`,
  }),
  post({
    id: "blog_editorial_so_sanh",
    slug: "so-sanh-du-an-khong-bia-thoi-gian",
    title: "So sánh dự án khi chưa có thời gian di chuyển",
    excerpt:
      "Tối đa ba dự án, năm tiêu chí bạn tự xếp, và khoảng cách đường chim bay khi có tọa độ. Thiếu dữ liệu thì bỏ tiêu chí đó — không bịa số phút.",
    seoTitle: "So sánh dự án không bịa thời gian đi | AnCư",
    seoDescription:
      "Trang so sánh AnCư nhận tối đa ba dự án. Tiêu chí thiếu số liệu bị bỏ qua. Bản đồ chỉ kẻ đường chim bay, không điền thời gian di chuyển.",
    publishedAt: "2026-10-12 09:00:00",
    projectSlugs: ["celadon-city", "vinhomes-grand-park", "ecopark"],
    bodyMarkdown: `
## Tối đa ba cột

Trang [so sánh](/compare) nhận nhiều nhất ba dự án. Đường dẫn dùng ba vị trí a, b và c. Thêm dự án thứ tư thì nút thêm tắt. Slug không có trong catalog bị bỏ qua. Chọn một dự án thì trang nhắc cần thêm cột — chưa đủ để đối chiếu.

Có thể mở từ trang dự án, ví dụ [Celadon City](/projects/celadon-city), [Vinhomes Grand Park](/projects/vinhomes-grand-park) hoặc [Ecopark](/projects/ecopark), rồi đưa sang bảng so.

## Thứ tự bạn chọn, không phải một mô hình chấm hộ

Năm tiêu chí: **ngân sách**, **không gian**, **di chuyển**, **trường học**, **tiện ích**. Bạn xếp thứ tự quan trọng. Điểm suy ra từ thứ tự đó, cùng một cách mỗi lần. Không có mô hình ngôn ngữ xếp hộ.

Tiêu chí nào chưa có số liệu thì bỏ tiêu chí đó. Không thế bằng một điểm trung tính cho có mặt trên bảng.

Giá đang **Chờ xác minh**, hoặc chỉ là dòng tham chiếu thị trường thứ cấp, không được tính như bảng giá chủ đầu tư. Ngân sách vì thế có thể trống trên một cột. Trống nghĩa là chưa chấm được khoản đó, không nghĩa là rẻ hơn.

## Di chuyển là đường chim bay

Tiêu chí di chuyển chỉ chạy khi bạn đã chọn một điểm đến và dự án có tọa độ. Khi đó khoảng cách là đường chim bay trong nhóm đang so. Khoảng cách không được đổi thành số phút.

Trang [bản đồ](/map) làm cùng một việc ở lớp xem: lọc nhóm tiện ích, chọn điểm đến, và nếu đủ tọa độ thì hiện cây số đường chim bay. Tham số project trên đường dẫn đưa bản đồ tới đúng dự án. Tiện ích thiếu tọa độ không được vẽ thành một điểm giả.

Dòng thời gian di chuyển ở lại trạng thái chưa cấu hình cho đến khi có động cơ định tuyến thời gian thực. Đó là câu trên bản đồ, không phải một ước lượng “khoảng mười lăm phút”.

## Đọc thứ hạng cho đúng

Một dự án đứng trên là đứng trên trong nhóm bạn đang mở, với những tiêu chí còn dữ liệu. Đổi nhóm, thứ hạng có thể đổi. Đó là so tương đối, không phải điểm tuyệt đối trên toàn thị trường.

> Không có nhà cung cấp định tuyến thì AnCư không điền số phút.
`,
  }),
  post({
    id: "blog_editorial_du_an",
    slug: "nhin-gan-du-an-dang-co-tren-ancu",
    title: "Nhìn gần các dự án đang có trên AnCư",
    excerpt:
      "Mười hồ sơ đang có trong catalog — Gamuda Land, Vinhomes, Ecopark, Đất Xanh / Bluemarq. Chỉ những gì hồ sơ đã ghi. Giá chủ đầu tư còn chờ thì để chờ.",
    seoTitle: "Nhìn gần dự án đang có trên AnCư | Blog",
    seoDescription:
      "Điểm qua các dự án đang có trên AnCư 3D theo hồ sơ catalog: vị trí, bàn giao đã công bố, và chỗ giá hay diện tích vẫn Chờ xác minh.",
    publishedAt: "2026-10-18 09:00:00",
    projectSlugs: [
      "eaton-park",
      "elysian",
      "celadon-city",
      "vinhomes-grand-park",
      "vinhomes-ocean-park",
      "vinhomes-smart-city",
      "ecopark",
      "ecopark-aqua-bay",
      "opal-boulevard",
      "the-prive",
    ],
    bodyMarkdown: `
## Không phải bảng giá tuần

Bài này điểm các hồ sơ đang nằm trong catalog AnCư. Mỗi đoạn chỉ nhắc điều hồ sơ đã ghi. Giá chủ đầu tư chưa có bảng thì giữ **Chờ xác minh**. Không có khoảng giá thị trường thứ cấp trong bài này.

## Gamuda Land

### Eaton Park

Khu đô thị tích hợp tại TP. Thủ Đức. Tên chủ đầu tư và khu vực có trên hồ sơ công khai. Địa chỉ, giá, quy mô, bàn giao và diện tích căn vẫn chờ xác minh. Tiện ích nội khu đang ghi theo thiết kế, chưa phải danh sách đã nghiệm thu. [Xem Eaton Park](/projects/eaton-park)

### Elysian

Căn hộ Gamuda Land tại TP. Thủ Đức. Giá, quy mô và bàn giao chờ xác minh. [Xem Elysian](/projects/elysian)

### Celadon City

Khu đô thị tích hợp tại Tân Phú. Địa chỉ trên hồ sơ: Đường N1, khu đô thị Celadon City. Tiện ích đã gắn gồm Aeon Mall Celadon Tân Phú và trường quốc tế trong khu — đúng mục đang liệt kê, không phải một tiện ích được thêm ở đây. Các phân khu đã có cư dân; chi tiết từng block chờ bảng chủ đầu tư. Giá và diện tích căn chờ xác minh. [Xem Celadon City](/projects/celadon-city) · [Showroom](/projects/celadon-city/showroom)

## Vinhomes

### Vinhomes Grand Park

Đại đô thị tại Nguyễn Xiển, Long Bình, TP. Thủ Đức. Nhiều phân khu đã bàn giao. The Opus One đang hoàn thiện, hướng bàn giao từ 2026 theo thông tin công bố từ chủ đầu tư hoặc đối tác đã gắn trên hồ sơ. Tiện ích liệt kê gồm công viên trung tâm, Vincom Mega Mall Grand Park, Vinmec vệ tinh, và VinWonders cùng tiện ích thể thao nội khu. Số căn từng phân khu và giá chủ đầu tư chờ xác minh. [Xem Grand Park](/projects/vinhomes-grand-park)

### Vinhomes Ocean Park

Tổ hợp phía đông Hà Nội, hành lang Gia Lâm / Hưng Yên. Nhiều phân khu đã bàn giao. Zurich, London và Beverly có lộ trình bàn giao công bố 2025–2026 trên hồ sơ. Giá và tổng căn chờ xác minh. [Xem Ocean Park](/projects/vinhomes-ocean-park)

### Vinhomes Smart City

Tây Mỗ — Đại Mỗ, Nam Từ Liêm. Nhiều phân khu đã bàn giao; hồ sơ ghi giao dịch hiện chủ yếu là thứ cấp. Giá chủ đầu tư gốc chờ xác minh. [Xem Smart City](/projects/vinhomes-smart-city)

## Ecopark

### Ecopark

Khu đô thị sinh thái tại Xuân Quan, Văn Giang, Hưng Yên, liền kề phía đông Hà Nội. Hồ sơ ghi quy hoạch công bố khoảng 500 ha; tổng số căn vẫn chờ xác minh. Nhiều phân khu thấp tầng và cao tầng đã bàn giao hoặc đang vận hành. Tiện ích trên hồ sơ gồm Hồ Thiên Nga, sân golf EPGA và phố thương mại nội khu. Giá chủ đầu tư chờ xác minh. [Xem Ecopark](/projects/ecopark)

### Aqua Bay

Cụm khoảng 7 tháp trong Ecopark, bàn giao từ khoảng 2019. Hồ sơ ghi giao dịch hiện là thứ cấp và có sổ. Giá chủ đầu tư gốc chờ xác minh. Khung diện tích một số loại căn, nếu có trên trang, là tham chiếu phân khu — cần đối chiếu từng căn, không phải bảng bán. [Xem Aqua Bay](/projects/ecopark-aqua-bay)

## Đất Xanh / Bluemarq

Catalog ghi chủ đầu tư là Đất Xanh / Bluemarq Group. Hồ sơ nhà phát triển ghi việc chuyển tên thương hiệu, mã DXG giữ nguyên, theo công bố công khai đã gắn nguồn — không phải một tin mới của bài này.

### Opal Boulevard

Mặt tiền Phạm Văn Đồng, khu vực An Bình, Dĩ An. Hồ sơ công bố 4 block, khoảng 1.446 căn, bàn giao từ giữa 2021. Phí bảo trì đã chuyển ban quản trị theo thông tin công bố tháng 9/2025 gắn trên hồ sơ. Giá chờ xác minh. [Xem Opal Boulevard](/projects/opal-boulevard)

### The Privé

Nam Rạch Chiếc, TP. Thủ Đức; trước đây gắn với Gem Riverside. Quy mô công bố khoảng 6,7 ha và 12 tháp. Đang thi công; bàn giao dự kiến từ 2027 theo lộ trình công bố. Giá mở bán sơ cấp chờ bảng chủ đầu tư. [Xem The Privé](/projects/the-prive)

> Bài này chỉ điểm các hồ sơ đang có trên AnCư. Không phải bảng giá, không phải lời chào bán.
`,
  }),
];

/** D1 row wins when the slug already exists, including draft or archived. */
export function mergePublishedBlogPosts(dbPosts: BlogPost[]): BlogPost[] {
  const bySlug = new Map(dbPosts.map((item) => [item.slug, item]));
  for (const seed of EDITORIAL_BLOG_POSTS) {
    if (!bySlug.has(seed.slug)) bySlug.set(seed.slug, seed);
  }
  return [...bySlug.values()]
    .filter((item) => item.status === "published")
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}