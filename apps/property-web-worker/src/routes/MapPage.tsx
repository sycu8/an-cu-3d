import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { getRoute, type RouteResult } from "@ancu/shared";
import { getAllNearbyPlaces } from "../data/gamuda-projects";
import { PageSkeleton } from "../components/PageSkeleton";
import { useProjectSummaries } from "../hooks/useProjects";
import {
  loadLifestylePreferences,
  saveLifestylePreferences,
} from "../lib/lifestylePreferences";
import { AMENITY_CATEGORIES, type AmenityCategory } from "../types/amenity";
import "./MapPage.css";

const HCMC_CENTER: [number, number] = [106.6297, 10.8231];

type MapLibreModule = typeof import("maplibre-gl");

function parseCategoriesParam(raw: string | null): Set<AmenityCategory> | null {
  if (!raw?.trim()) return null;
  const ids = new Set(AMENITY_CATEGORIES.map((c) => c.id));
  const next = new Set<AmenityCategory>();
  for (const part of raw.split(",")) {
    const id = part.trim() as AmenityCategory;
    if (ids.has(id)) next.add(id);
  }
  return next.size ? next : null;
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const maplibreRef = useRef<MapLibreModule | null>(null);
  const markersRef = useRef<import("maplibre-gl").Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProject = searchParams.get("project");
  const destinationId = searchParams.get("destination") ?? "";
  const [categories, setCategories] = useState<Set<AmenityCategory>>(() => {
    return (
      parseCategoriesParam(searchParams.get("categories")) ??
      new Set(AMENITY_CATEGORIES.map((c) => c.id))
    );
  });
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const projectState = useProjectSummaries();

  const projects =
    "data" in projectState && projectState.data ? projectState.data : [];
  const nearbyPlaces = useMemo(() => getAllNearbyPlaces(), []);

  useEffect(() => {
    const container = mapContainer.current;
    if (!container || mapRef.current) return;

    let observer: IntersectionObserver | null = null;
    let cancelled = false;

    const initMap = async () => {
      const maplibregl = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (cancelled || !container || mapRef.current) return;

      maplibreRef.current = maplibregl;

      const mapOptions: import("maplibre-gl").MapOptions & {
        cooperativeGestures?: boolean;
      } = {
        container,
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
      };

      if ("cooperativeGestures" in maplibregl.Map.prototype) {
        mapOptions.cooperativeGestures = true;
      }

      const map = new maplibregl.Map(mapOptions);
      map.addControl(new maplibregl.NavigationControl(), "top-right");
      mapRef.current = map;
      setMapReady(true);
    };

    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer?.disconnect();
          void initMap();
        }
      },
      { rootMargin: "100px" },
    );
    observer.observe(container);

    return () => {
      cancelled = true;
      observer?.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      maplibreRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !maplibregl || !mapReady) return;

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
  }, [projects, nearbyPlaces, categories, selectedProject, mapReady]);

  const routeProject = selectedProject
    ? projects.find((p) => p.slug === selectedProject)
    : projects[0];

  const routePlace = destinationId
    ? nearbyPlaces.find((p) => p.id === destinationId)
    : undefined;

  useEffect(() => {
    let cancelled = false;
    setRouteResult(null);
    if (
      !routeProject?.latitude ||
      !routeProject?.longitude ||
      !routePlace?.latitude ||
      !routePlace?.longitude
    ) {
      return;
    }
    void getRoute({
      origin: {
        latitude: routeProject.latitude,
        longitude: routeProject.longitude,
      },
      destination: {
        latitude: routePlace.latitude,
        longitude: routePlace.longitude,
      },
      mode: "driving",
    }).then((result) => {
      if (!cancelled) setRouteResult(result);
    });
    return () => {
      cancelled = true;
    };
  }, [
    routeProject?.latitude,
    routeProject?.longitude,
    routePlace?.latitude,
    routePlace?.longitude,
  ]);

  if (projectState.status === "loading") return <PageSkeleton />;

  if (projectState.status === "error" && !projects.length) {
    return (
      <div className="container page-header">
        <h1>Bản đồ kết nối</h1>
        <p role="alert">{projectState.error}</p>
      </div>
    );
  }

  const syncUrl = (next: {
    project?: string | null;
    destination?: string | null;
    categories?: Set<AmenityCategory>;
  }) => {
    const params = new URLSearchParams();
    const project = next.project === undefined ? selectedProject : next.project;
    const destination =
      next.destination === undefined ? destinationId : next.destination;
    const cats = next.categories ?? categories;
    if (project) params.set("project", project);
    if (destination) params.set("destination", destination);
    const allOn = AMENITY_CATEGORIES.every((c) => cats.has(c.id));
    if (!allOn && cats.size > 0) {
      params.set("categories", [...cats].join(","));
    }
    setSearchParams(params, { replace: true });
  };

  const setDestination = (id: string) => {
    syncUrl({ destination: id || null });
    const place = nearbyPlaces.find((p) => p.id === id);
    if (place?.latitude && place?.longitude) {
      const prefs = loadLifestylePreferences();
      saveLifestylePreferences({
        ...prefs,
        commuteLabel: place.name,
        commuteDestination: {
          latitude: place.latitude,
          longitude: place.longitude,
        },
      });
    }
  };

  const toggleCategory = (cat: AmenityCategory) => {
    const next = new Set(categories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setCategories(next);
    syncUrl({ categories: next });
  };

  return (
    <div className="map-page">
      <div className="container map-header">
        <header className="page-header">
          <h1>Bản đồ kết nối</h1>
          <p>
            Dự án và điểm tiện ích xung quanh TP. Hồ Chí Minh.
            {projectState.status === "ready" && (
              <> Nguồn dự án: {projectState.source}.</>
            )}
          </p>
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
              Dùng động cơ định tuyến dùng chung — hiện chỉ khoảng cách đường chim bay;
              không bịa thời gian di chuyển.
            </p>
            <label className="route-select">
              Điểm đến
              <select
                value={destinationId}
                onChange={(e) => setDestination(e.target.value)}
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
            {routeResult ? (
              <p className="route-result">
                Khoảng cách đường chim bay:{" "}
                <strong>{routeResult.distanceKm.toFixed(1)} km</strong>
                <span className="map-route-provider">
                  {" "}
                  · {routeResult.provider}
                </span>
              </p>
            ) : destinationId ? (
              <p className="map-route-note">
                Chưa đủ tọa độ dự án hoặc điểm đến để tính khoảng cách.
              </p>
            ) : null}
            <p className="route-duration map-route-note">
              Thời gian di chuyển:{" "}
              {routeResult?.durationMinutes != null
                ? `${routeResult.durationMinutes} phút`
                : routeResult?.unavailableReason ??
                  "Chưa cấu hình động cơ định tuyến thời gian thực."}
            </p>
          </div>
        </aside>
        <div
          ref={mapContainer}
          className="map-container"
          role="application"
          aria-label="Map of HCMC projects"
        />
      </div>

      <div className="container map-project-links">
        <h3>Dự án trên bản đồ</h3>
        <div className="map-project-chips">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/map?project=${p.slug}${destinationId ? `&destination=${destinationId}` : ""}`}
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
