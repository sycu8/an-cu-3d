import { useMemo, useState } from "react";
import { mediaUrl, type ProjectMediaItem } from "@ancu/shared";
import "./MediaGallery.css";

type MediaGalleryProps = {
  items: ProjectMediaItem[];
  emptyLabel: string;
  variant?: "card" | "hero";
};

function resolveSrc(item: ProjectMediaItem, variant: "card" | "hero"): string | null {
  if (item.url?.trim()) return item.url.trim();
  if (item.r2Key?.trim()) {
    return mediaUrl(item.r2Key.trim(), { variant, format: "webp" });
  }
  return null;
}

export function MediaGallery({
  items,
  emptyLabel,
  variant = "hero",
}: MediaGalleryProps) {
  const resolved = useMemo(
    () =>
      items
        .map((item) => ({ item, src: resolveSrc(item, variant) }))
        .filter((entry): entry is { item: ProjectMediaItem; src: string } => Boolean(entry.src)),
    [items, variant],
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = resolved.find((entry) => entry.item.id === activeId) ?? resolved[0];

  if (!resolved.length || !active) {
    return (
      <div className="media-gallery media-gallery-empty" role="status">
        <p>{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="media-gallery">
      <figure className="media-gallery-hero">
        <img src={active.src} alt={active.item.altText ?? ""} />
        {(active.item.caption || active.item.provenance) && (
          <figcaption>
            {active.item.caption && <strong>{active.item.caption}</strong>}
            {active.item.provenance && <span>{active.item.provenance}</span>}
          </figcaption>
        )}
      </figure>
      {resolved.length > 1 && (
        <div className="media-gallery-thumbs" role="list">
          {resolved.map((entry) => (
            <button
              key={entry.item.id}
              type="button"
              role="listitem"
              className={entry.item.id === active.item.id ? "active" : undefined}
              onClick={() => setActiveId(entry.item.id)}
              aria-label={entry.item.caption ?? entry.item.altText ?? "Chọn hình"}
            >
              <img src={resolveSrc(entry.item, "card") ?? entry.src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
