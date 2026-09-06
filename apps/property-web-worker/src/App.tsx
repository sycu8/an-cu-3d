import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Layout } from "./components/Layout";
import { PageSkeleton } from "./components/PageSkeleton";

const HomePage = lazy(() => import("./routes/HomePage"));
const ProjectsPage = lazy(() => import("./routes/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("./routes/ProjectDetailPage"));
const Project3DPage = lazy(() => import("./routes/Project3DPage"));
const ApartmentsPage = lazy(() => import("./routes/ApartmentsPage"));
const ApartmentViewerPage = lazy(() => import("./routes/ApartmentViewerPage"));
const MapPage = lazy(() => import("./routes/MapPage"));
const ComparePage = lazy(() => import("./routes/ComparePage"));

function lazyRoute(Component: ComponentType) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Component />
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: lazyRoute(HomePage) },
      { path: "projects", element: lazyRoute(ProjectsPage) },
      { path: "projects/:slug", element: lazyRoute(ProjectDetailPage) },
      { path: "projects/:slug/3d", element: lazyRoute(Project3DPage) },
      { path: "projects/:slug/apartments", element: lazyRoute(ApartmentsPage) },
      { path: "projects/:slug/apartments/:unit", element: lazyRoute(ApartmentViewerPage) },
      { path: "map", element: lazyRoute(MapPage) },
      { path: "compare", element: lazyRoute(ComparePage) },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
