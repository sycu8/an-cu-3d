import { Link } from "react-router";
import { BRAND, TAGLINE } from "@ancu/shared";
import { ProjectCard } from "../components/ProjectCard";
import { ProjectSearchPanel } from "../components/ProjectSearchPanel";
import { PageSkeleton } from "../components/PageSkeleton";
import { useProjectSummaries } from "../hooks/useProjects";
import { districtProjectCounts, listDistrictOptions } from "../lib/projectFilters";
import { HERO_IMAGE } from "../lib/projectVisuals";
import "./HomePage.css";

const TOOLS = [
  {
    to: "/tools/loan",
    title: "Tính khoản vay",
    desc: "Ước tính trả góp theo lãi Big 4 — có nguồn, không báo giá ngân hàng.",
  },
  {
    to: "/tools/investment",
    title: "Phân tích phù hợp",
    desc: "Ngân sách, không gian, đi lại — xếp hạng dự án theo tiêu chí của bạn.",
  },
  {
    to: "/map",
    title: "Tiện ích xung quanh",
    desc: "Lọc trường học, bệnh viện, công viên trên bản đồ dự án.",
  },
  {
    to: "/compare",
    title: "So sánh dự án",
    desc: "Đối chiếu tối đa 3 dự án với trọng số bạn chọn.",
  },
] as const;

const BUYER_STEPS = [
  {
    step: 1,
    title: "Lập kế hoạch",
    points: ["Chọn loại hình & khu vực", "Khung ngân sách thật", "Hồ sơ tín dụng"],
  },
  {
    step: 2,
    title: "Tìm & lọc",
    points: ["Tiêu chí nâng cao", "Tiện ích xung quanh", "Nguồn giá rõ ràng"],
  },
  {
    step: 3,
    title: "Hiểu căn nhà",
    points: ["Mặt bằng tin cậy", "Không gian 2D/3D", "Điểm phù hợp"],
  },
  {
    step: 4,
    title: "Vay & tài chính",
    points: ["Ước tính khoản vay", "Khả năng trả góp", "Rủi ro lãi suất"],
  },
  {
    step: 5,
    title: "Quyết định",
    points: ["So sánh dự án", "Pháp lý & bàn giao", "Nguồn dữ liệu"],
  },
  {
    step: 6,
    title: "Vào ở",
    points: ["Showroom nội thất", "Tiện ích khu vực", "Theo dõi sau mua"],
  },
] as const;

export default function HomePage() {
  const state = useProjectSummaries();

  if (state.status === "loading") return <PageSkeleton />;
  if (state.status === "error" && !state.data?.length) {
    return (
      <div className="container page-header">
        <h1>Không tải được dự án</h1>
        <p role="alert">{state.error}</p>
      </div>
    );
  }

  const projects = state.data ?? [];
  const featured = projects.slice(0, 6);
  const districts = listDistrictOptions(projects);
  const areaCounts = districtProjectCounts(projects);

  return (
    <div className="home">
      <section className="hero" aria-label={BRAND}>
        <div
          className="hero-media"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
          role="img"
          aria-label="Không gian nhà mẫu hiện đại"
        />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <p className="hero-brand">{BRAND}</p>
          <h1 className="hero-title">{TAGLINE}</h1>
          <p className="hero-desc">
            Tìm nhà thông thái — lọc theo tiêu chí thật, hiểu căn trước khi gọi là nhà.
          </p>
          <div className="hero-search-wrap">
            <ProjectSearchPanel variant="hero" districts={districts} mode="navigate" />
          </div>
        </div>
        <a href="#tools" className="hero-scroll" aria-label="Xuống công cụ">
          <span aria-hidden="true" />
        </a>
      </section>

      <section id="tools" className="home-tools">
        <div className="container">
          <header className="section-head section-head--row">
            <div>
              <h2>Công cụ quyết định</h2>
              <p className="section-desc">
                Tài chính, tiện ích và so sánh — cùng một hành trình mua nhà thông thái.
              </p>
            </div>
            <Link to="/tools" className="section-link">
              Tất cả công cụ
            </Link>
          </header>
          <ul className="home-tools-rail">
            {TOOLS.map((tool, i) => (
              <li key={tool.to} style={{ animationDelay: `${i * 60}ms` }}>
                <Link to={tool.to} className="home-tool-link">
                  <strong>{tool.title}</strong>
                  <span>{tool.desc}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="featured" className="container home-featured">
        <header className="section-head section-head--row">
          <div>
            <h2>Dự án nổi bật</h2>
            <p className="section-desc">Không gian thật — dữ liệu minh bạch, nguồn rõ ràng.</p>
          </div>
          <Link to="/projects" className="section-link">
            Tất cả dự án
          </Link>
        </header>
        <div className="home-project-rail" role="list">
          {featured.map((p, i) => (
            <div
              key={p.id}
              role="listitem"
              className="home-card-enter"
              style={{ animationDelay: `${Math.min(i, 5) * 70}ms` }}
            >
              <ProjectCard project={p} />
            </div>
          ))}
        </div>
      </section>

      <section className="home-areas" aria-labelledby="areas-heading">
        <div className="container">
          <header className="section-head">
            <h2 id="areas-heading">Dự án theo khu vực</h2>
            <p className="section-desc">Chọn khu vực để lọc danh sách — giống cách tìm nhà theo quận.</p>
          </header>
          <ul className="home-areas-grid">
            {areaCounts.map((area, i) => (
              <li key={area.district} style={{ animationDelay: `${i * 50}ms` }}>
                <Link
                  to={`/projects?district=${encodeURIComponent(area.district)}`}
                  className="home-area-link"
                >
                  <strong>{area.district}</strong>
                  <span>
                    {area.count}+ dự án
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="home-guide container" aria-labelledby="guide-heading">
        <header className="section-head section-head--row">
          <div>
            <h2 id="guide-heading">Cẩm nang mua nhà lần đầu</h2>
            <p className="section-desc">Sáu bước từ kế hoạch đến vào ở — gắn với công cụ AnCư.</p>
          </div>
          <Link to="/blog" className="section-link">
            Kiến thức BĐS
          </Link>
        </header>
        <ol className="home-guide-steps">
          {BUYER_STEPS.map((item) => (
            <li key={item.step}>
              <p className="home-guide-stepnum">Bước {item.step}</p>
              <h3>{item.title}</h3>
              <ul>
                {item.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <div className="home-guide-cta">
          <Link to="/tools/loan" className="btn btn-secondary">
            Bắt đầu với tính vay
          </Link>
          <Link to="/compare" className="btn btn-ghost">
            So sánh dự án
          </Link>
        </div>
      </section>

      <section className="home-retain container">
        <div className="home-retain-panel">
          <h2>Ở lại với không gian thật</h2>
          <p>
            Mặt bằng có nhãn tin cậy, showroom 3D và bản đồ tiện ích — mượt trên điện thoại.
          </p>
          <div className="home-retain-actions">
            <Link to="/map" className="btn btn-primary">
              Xem bản đồ
            </Link>
            <Link to="/blog" className="btn btn-ghost">
              Đọc blog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
