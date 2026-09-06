/**
 * Routing provider abstraction — UI must not hardwire a vendor.
 * When no provider is configured, return distance-only / unavailable.
 */

export type TravelMode = "driving" | "motorcycle" | "walking" | "transit";

export interface RouteRequest {
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  mode: TravelMode;
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number | null;
  provider: string;
  mode: TravelMode;
  unavailableReason?: string;
}

export interface RoutingProvider {
  id: string;
  getRoute(request: RouteRequest): Promise<RouteResult>;
}

/** Haversine distance in km. */
export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Fallback provider: distance only, never fabricates travel time. */
export class DistanceOnlyRoutingProvider implements RoutingProvider {
  id = "distance-only";

  async getRoute(request: RouteRequest): Promise<RouteResult> {
    const distanceKm =
      Math.round(haversineKm(request.origin, request.destination) * 100) / 100;
    return {
      distanceKm,
      durationMinutes: null,
      provider: this.id,
      mode: request.mode,
      unavailableReason: "Chưa cấu hình động cơ định tuyến — chỉ hiển thị khoảng cách đường chim bay.",
    };
  }
}

let activeProvider: RoutingProvider = new DistanceOnlyRoutingProvider();

export function setRoutingProvider(provider: RoutingProvider): void {
  activeProvider = provider;
}

export function getRoutingProvider(): RoutingProvider {
  return activeProvider;
}

export async function getRoute(request: RouteRequest): Promise<RouteResult> {
  return activeProvider.getRoute(request);
}
