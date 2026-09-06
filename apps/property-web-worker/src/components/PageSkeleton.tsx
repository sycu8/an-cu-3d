export function PageSkeleton() {
  return (
    <div className="page-skeleton container" aria-busy="true" aria-label="Đang tải trang">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text skeleton-text-short" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    </div>
  );
}
