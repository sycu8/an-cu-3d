/** 2D point in meters, axis-aligned plan coordinates. */
export type Vec2 = [number, number];

export function vec2(x: number, y: number): Vec2 {
  return [x, y];
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return [a[0] + b[0], a[1] + b[1]];
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return [a[0] - b[0], a[1] - b[1]];
}

export function scale(v: Vec2, factor: number): Vec2 {
  return [v[0] * factor, v[1] * factor];
}

export function dot(a: Vec2, b: Vec2): number {
  return a[0] * b[0] + a[1] * b[1];
}

export function length(v: Vec2): number {
  return Math.hypot(v[0], v[1]);
}

export function distance(a: Vec2, b: Vec2): number {
  return length(sub(b, a));
}

export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  if (len === 0) return [0, 0];
  return [v[0] / len, v[1] / len];
}

export function midpoint(a: Vec2, b: Vec2): Vec2 {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export function angle(a: Vec2, b: Vec2): number {
  return Math.atan2(b[1] - a[1], b[0] - a[0]);
}

export function nearlyEqual(a: Vec2, b: Vec2, epsilon = 1e-6): boolean {
  return Math.abs(a[0] - b[0]) <= epsilon && Math.abs(a[1] - b[1]) <= epsilon;
}

export function polygonArea(points: Vec2[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i]!;
    const [x2, y2] = points[(i + 1) % points.length]!;
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}
