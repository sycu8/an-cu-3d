import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getProjectSummaries, getAllNearbyPlaces } from "../data/gamuda-projects";
import { AMENITY_CATEGORIES, type AmenityCategory } from "../types/amenity";
import "./MapPage.css";

const HCMC_CENTER: [number, number] = [106.6297, 10.8231];

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [searchParams] = useSearchParams();
  const selectedProject = searchParams.get("project");
  const [categories, setCategories] = useState<Set<AmenityCategory>>(
    new Set(AMENITY_CATEGORIES.map((c) => c.id)),
  );
  const [routeDestination, setRouteDestination] = useState<string>("");

  const projects = getProjectSummaries();
  const nearbyPlaces = getAllNearbyPlaces();

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: HCMC_CENTER,
      zoom: 11,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const project of projects) {
      if (!project.latitude || !project.longitude) continue;
      if (selectedProject && project.slug !== selectedProject) continue;

      const el = document.createElement("div");
      el.className = "map-marker map-marker-project";
      el.innerHTML = `<span>${project.name}</span>`;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([project.longitude, project.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 16 }).setHTML(
            `<strong>${project.name}</strong><br/>${project.district ?? ""}<br/><a href="/projects/${project.slug}">Chi tiết</a>`,
          ),
        )
        .addTo(map);
      markersRef.current.push(marker);
    }

    for (const place of nearbyPlaces) {
      if (!categories.has(place.category as AmenityCategory)) continue;
      if (!place.latitude || !place.longitude) continue;

      const el = document.createElement("div");
      el.className = `map-marker map-marker-poi map-marker-${place.category}`;
      el.title = place.name;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 12 }).setHTML(
            `<strong>${place.name}</strong><br/><span class="tag">${place.category}</span>`,
          ),
        )
        .addTo(map);
      markersRef.current.push(marker);
    }

    if (selectedProject) {
      const p = projects.find((pr) => pr.slug === selectedProject);
      if (p?.latitude && p?.longitude) {
        map.flyTo({ center: [p.longitude, p.latitude], zoom: 13 });
      }
    }
  }, [projects, nearbyPlaces, categories, selectedProject]);

  const routeProject = selectedProject
    ? projects.find((p) => p.slug === selectedProject)
    : projects[0];

  const routePlace = routeDestination
    ? nearbyPlaces.find((p) => p.id === routeDestination)
    : undefined;

  let straightLineKm: number | null = null;
  if (
    routeProject?.latitude &&
    routeProject?.longitude &&
    routePlace?.latitude &&
    routePlace?.longitude
  ) {
    straightLineKm = haversineKm(
      routeProject.latitude,
      routeProject.longitude,
      routePlace.latitude,
      routePlace.longitude,
    );
  }

  const toggleCategory = (cat: AmenityCategory) => {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="map-page">
      <div className="container map-header">
        <header className="page-header">
          <h1>Bản đồ kết nối</h1>
          <p>Dự án và điểm tiện ích xung quanh TP. Hồ Chí Minh.</p>
        </header>
      </div>

      <div className="map-layout">
        <aside className="map-sidebar card">
          <div className="card-body">
            <h3>Bộ lọc</h3>
            <div className="category-filters">
              {AMENITY_CATEGORIES.map((cat) => (
                <label key={cat.id} className="category-filter">
                  <input
                    type="checkbox"
                    checked={categories.has(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                  />
                  {cat.label}
                </label>
              ))}
            </div>

            <h3>Tuyến đường</h3>
            <p className="map-route-note">
              Thời gian di chuyển thực tế chưa có — hiển thị khoảng cách đường thẳng gần đúng khi có tọa độ.
            </p>
            <label className="route-select">
              Điểm đến
              <select
                value={routeDestination}
                onChange={(e) => setRouteDestination(e.target.value)}
              >
                <option value="">— Chọn —</option>
                {nearbyPlaces
                  .filter((p) => p.latitude && p.longitude)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.projectName})
                    </option>
                  ))}
              </select>
            </label>
            {straightLineKm != null ? (
              <p className="route-result">
                Khoảng cách đường thẳng (gần đúng): <strong>{straightLineKm.toFixed(1)} km</strong>
              </p>
            ) : routeDestination ? (
              <p className="pending-data">Data pending verification</p>
            ) : null}
            <p className="route-duration pending-data">
              Thời gian di chuyển: Data pending verification
            </p>
          </div>
        </aside>
        <div ref={mapContainer} className="map-container" role="application" aria-label="Map of HCMC projects" />
      </div>

      <div className="container map-project-links">
        <h3>Dự án trên bản đồ</h3>
        <div className="map-project-chips">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/map?project=${p.slug}`}
              className={`chip ${selectedProject === p.slug ? "active" : ""}`}
            >
              {p.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
