import { Link } from "react-router";
import { LifestylePreferencesForm } from "../components/LifestylePreferencesForm";
import "./ToolsPage.css";

export default function InvestmentToolsPage() {
  return (
    <div className="container invest-page">
      <header className="page-header">
        <p>
          <Link to="/tools">← Công cụ</Link>
        </p>
        <h1>Phân tích phù hợp</h1>
        <p>
          Đặt ngân sách và thứ tự ưu tiên — AnCư dùng trọng số deterministic để xếp hạng
          dự án. Không phải máy tính ROI thuê/bán; thiếu số liệu thì bỏ qua, không bịa.
        </p>
      </header>

      <LifestylePreferencesForm />

      <div className="invest-actions">
        <Link to="/compare" className="btn btn-primary">
          So sánh theo tiêu chí này
        </Link>
        <Link to="/tools/loan" className="btn btn-secondary">
          Tính khoản vay
        </Link>
        <Link to="/map" className="btn btn-ghost">
          Bản đồ tiện ích
        </Link>
      </div>
    </div>
  );
}
