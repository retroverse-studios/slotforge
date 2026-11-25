export interface Vec2 {
  x: number;
  y: number;
}

export interface Pose {
  x: number;
  y: number;
  heading: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface SampledPath {
  points: Vec2[];
  headings: number[];
}

export const TAU = Math.PI * 2;

export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** Normalise an angle to (-PI, PI]. */
export function normalizeAngle(angle: number): number {
  let value = (angle + Math.PI) % TAU;
  if (value < 0) value += TAU;
  return value - Math.PI;
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function advance(pose: Pose, length: number): Pose {
  return {
    x: pose.x + Math.cos(pose.heading) * length,
    y: pose.y + Math.sin(pose.heading) * length,
    heading: pose.heading,
  };
}

/**
 * Pose after an arc. `direction` is +1 for a left turn and -1 for a right.
 * Radius is the centreline radius, not the nominal outside radius.
 */
export function arcPose(
  pose: Pose,
  radius: number,
  angle: number,
  direction: 1 | -1,
): Pose {
  const nx = -Math.sin(pose.heading);
  const ny = Math.cos(pose.heading);
  const cx = pose.x + direction * radius * nx;
  const cy = pose.y + direction * radius * ny;
  const start = Math.atan2(pose.y - cy, pose.x - cx);
  const end = start + direction * angle;
  return {
    x: cx + radius * Math.cos(end),
    y: cy + radius * Math.sin(end),
    heading: normalizeAngle(pose.heading + direction * angle),
  };
}

/** Left normal of a heading. Positive lane offsets are to the left of travel. */
export function normalAt(heading: number): Vec2 {
  return { x: -Math.sin(heading), y: Math.cos(heading) };
}

export function sampleStraight(pose: Pose, length: number): SampledPath {
  const nx = Math.cos(pose.heading);
  const ny = Math.sin(pose.heading);
  return {
    points: [
      { x: pose.x, y: pose.y },
      { x: pose.x + nx * length, y: pose.y + ny * length },
    ],
    headings: [pose.heading, pose.heading],
  };
}

export function sampleArc(
  pose: Pose,
  radius: number,
  angle: number,
  direction: 1 | -1,
): SampledPath {
  const nx = -Math.sin(pose.heading);
  const ny = Math.cos(pose.heading);
  const cx = pose.x + direction * radius * nx;
  const cy = pose.y + direction * radius * ny;
  const start = Math.atan2(pose.y - cy, pose.x - cx);
  const segments = Math.max(8, Math.ceil((Math.abs(angle) * 180) / Math.PI / 5));
  const points: Vec2[] = [];
  const headings: number[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const theta = start + direction * angle * t;
    points.push({
      x: cx + radius * Math.cos(theta),
      y: cy + radius * Math.sin(theta),
    });
    headings.push(normalizeAngle(pose.heading + direction * angle * t));
  }
  return { points, headings };
}

export function offsetPolyline(
  points: Vec2[],
  headings: number[],
  offset: number,
): Vec2[] {
  return points.map((point, index) => {
    const heading = headings[index] ?? 0;
    const normal = normalAt(heading);
    return { x: point.x + normal.x * offset, y: point.y + normal.y * offset };
  });
}

export function polylineLength(points: Vec2[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const current = points[i];
    if (previous && current) total += distance(previous, current);
  }
  return total;
}

export function boundsOf(points: Vec2[]): Bounds {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.x > maxX) maxX = point.x;
    if (point.y > maxY) maxY = point.y;
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function unionBounds(a: Bounds | null, b: Bounds): Bounds {
  if (!a) return b;
  const minX = Math.min(a.minX, b.minX);
  const minY = Math.min(a.minY, b.minY);
  const maxX = Math.max(a.maxX, b.maxX);
  const maxY = Math.max(a.maxY, b.maxY);
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function toMillimetres(inches: number): number {
  return inches * 25.4;
}

export function toInches(millimetres: number): number {
  return millimetres / 25.4;
}
