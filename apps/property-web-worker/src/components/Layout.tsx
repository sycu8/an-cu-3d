import { Link, NavLink, Outlet } from "react-router";
import { BRAND, TAGLINE } from "@ancu/shared";
import "./Layout.css";

export function Layout() {
  return (
    <div className="layout">
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            {BRAND}
          </Link>
          <nav className="main-nav" aria-label="Main navigation">
            <NavLink to="/projects" className={({ isActive }) => (isActive ? "active" : "")}>
              Dự án
            </NavLink>
            <NavLink to="/map" className={({ isActive }) => (isActive ? "active" : "")}>
              Bản đồ
            </NavLink>
            <NavLink to="/compare" className={({ isActive }) => (isActive ? "active" : "")}>
              So sánh
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container">
          <p>
            {BRAND} — {TAGLINE}
          </p>
          <p className="footer-note">Dữ liệu chưa xác minh được ghi rõ &ldquo;Data pending verification&rdquo;.</p>
        </div>
      </footer>
    </div>
  );
}
