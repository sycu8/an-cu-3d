import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { BRAND, TAGLINE } from "@ancu/shared";
import { HUB_LINKS } from "../seo/site-copy";
import "./Layout.css";

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="layout">
      <a href="#main-content" className="skip-link">
        Chuyển đến nội dung chính
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" onClick={closeMenu}>
            {BRAND}
          </Link>
          <button
            type="button"
            className={`nav-toggle${menuOpen ? " is-open" : ""}`}
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="sr-only">{menuOpen ? "Đóng menu" : "Mở menu"}</span>
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
          <nav
            id="primary-nav"
            className={`main-nav${menuOpen ? " is-open" : ""}`}
            aria-label="Điều hướng chính"
          >
            <NavLink to="/projects" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
              Dự án
            </NavLink>
            <NavLink to="/map" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
              Bản đồ
            </NavLink>
            <NavLink to="/tools" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
              Công cụ
            </NavLink>
            <NavLink to="/compare" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
              So sánh
            </NavLink>
            <NavLink to="/blog" onClick={closeMenu} className={({ isActive }) => (isActive ? "active" : "")}>
              Blog
            </NavLink>
          </nav>
        </div>
      </header>
      <main id="main-content" className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <p className="footer-brand">{BRAND}</p>
            <p className="footer-tagline">{TAGLINE}</p>
          </div>
          <nav className="footer-links" aria-label="Trang trong AnCư">
            <Link to="/projects">Dự án</Link>
            <Link to="/map">Bản đồ</Link>
            <Link to="/tools">Công cụ</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/admin" className="footer-admin">
              Admin
            </Link>
          </nav>
          <div>
            <p className="footer-kicker">Orange Cloud</p>
            <nav className="footer-links" aria-label="Các dự án Orange Cloud">
              {HUB_LINKS.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
          <p className="footer-note">
            Explore. Compare. Decide. — Dữ liệu chưa xác minh được ghi rõ hoặc ẩn; không
            trình bày placeholder như sự thật. AnCư 3D là một phần của Orange Cloud, dự án
            cá nhân, không phải sản phẩm của Cloudflare, Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
