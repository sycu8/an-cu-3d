import { Link } from "react-router";
import "./ToolsPage.css";

const TOOLS = [
  {
    to: "/tools/loan",
    title: "Tính khoản vay",
    desc: "Ước tính trả góp hàng tháng theo lãi suất tham chiếu Big 4. Không phải báo giá ngân hàng realtime.",
  },
  {
    to: "/tools/investment",
    title: "Phân tích phù hợp & đầu tư ở",
    desc: "Đặt ngân sách, ưu tiên (không gian, đi lại, tiện ích) rồi so sánh dự án theo trọng số của bạn.",
  },
  {
    to: "/map",
    title: "Tiện ích & khám phá khu vực",
    desc: "Bản đồ dự án với lọc trường học, bệnh viện, công viên, giao thông — khoảng cách thẳng, ghi rõ nguồn.",
  },
  {
    to: "/compare",
    title: "So sánh dự án",
    desc: "Đối chiếu tối đa 3 dự án trước khi quyết định.",
  },
] as const;

export default function ToolsPage() {
  return (
    <div className="container tools-page">
      <header className="page-header">
        <h1>Công cụ</h1>
        <p>
          Bộ công cụ tìm nhà thông thái — tài chính, tiện ích, so sánh. Mọi ước tính đều
          có nhãn nguồn; thiếu dữ liệu thì nói rõ, không bịa.
        </p>
      </header>
      <ul className="tools-list">
        {TOOLS.map((tool) => (
          <li key={tool.to}>
            <Link to={tool.to} className="tools-item">
              <h2>{tool.title}</h2>
              <p>{tool.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="tools-note">
        Quy hoạch / ngập úng / giá đất theo thửa: chưa có nguồn xác minh trên AnCư — sẽ
        mở khi có dữ liệu công khai đáng tin, không giả lập.
      </p>
    </div>
  );
}
