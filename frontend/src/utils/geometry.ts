import type { ExcalidrawElement, Point } from '@/types/element.ts';

/**
 * Get the point on a shape's boundary that faces toward `target`.
 * Uses ray-from-center intersection for each shape type.
 */
export function getShapeBoundaryPoint(
  element: ExcalidrawElement,
  targetX: number,
  targetY: number,
): Point {
  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;

  switch (element.type) {
    case 'ellipse':
      return getEllipseBoundaryPoint(cx, cy, element.width / 2, element.height / 2, targetX, targetY);
    case 'diamond':
      return getDiamondBoundaryPoint(element, targetX, targetY);
    case 'hexagon':
      return getHexagonBoundaryPoint(element, targetX, targetY);
    case 'parallelogram':
      return getParallelogramBoundaryPoint(element, targetX, targetY);
    default:
      // Rectangle, cloud, and fallback
      return getRectBoundaryPoint(element, targetX, targetY);
  }
}

function getRectBoundaryPoint(
  element: ExcalidrawElement,
  targetX: number,
  targetY: number,
): Point {
  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;
  const hw = element.width / 2;
  const hh = element.height / 2;

  const dx = targetX - cx;
  const dy = targetY - cy;

  if (dx === 0 && dy === 0) {
    return { x: cx, y: element.y }; // default: top center
  }

  // Scale factor to reach the rectangle boundary
  const scaleX = hw / Math.abs(dx || 0.001);
  const scaleY = hh / Math.abs(dy || 0.001);
  const scale = Math.min(scaleX, scaleY);

  return {
    x: cx + dx * scale,
    y: cy + dy * scale,
  };
}

function getEllipseBoundaryPoint(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  targetX: number,
  targetY: number,
): Point {
  const dx = targetX - cx;
  const dy = targetY - cy;
  const angle = Math.atan2(dy, dx);

  return {
    x: cx + rx * Math.cos(angle),
    y: cy + ry * Math.sin(angle),
  };
}

function getDiamondBoundaryPoint(
  element: ExcalidrawElement,
  targetX: number,
  targetY: number,
): Point {
  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;
  const hw = element.width / 2;
  const hh = element.height / 2;

  // Diamond vertices: top, right, bottom, left
  const vertices: Point[] = [
    { x: cx, y: cy - hh },     // top
    { x: cx + hw, y: cy },     // right
    { x: cx, y: cy + hh },     // bottom
    { x: cx - hw, y: cy },     // left
  ];

  return getPolygonBoundaryPoint(cx, cy, vertices, targetX, targetY);
}

function getHexagonBoundaryPoint(
  element: ExcalidrawElement,
  targetX: number,
  targetY: number,
): Point {
  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;
  const w = element.width;
  const h = element.height;

  const vertices: Point[] = [
    { x: element.x + w * 0.25, y: element.y },
    { x: element.x + w * 0.75, y: element.y },
    { x: element.x + w, y: element.y + h * 0.5 },
    { x: element.x + w * 0.75, y: element.y + h },
    { x: element.x + w * 0.25, y: element.y + h },
    { x: element.x, y: element.y + h * 0.5 },
  ];

  return getPolygonBoundaryPoint(cx, cy, vertices, targetX, targetY);
}

function getParallelogramBoundaryPoint(
  element: ExcalidrawElement,
  targetX: number,
  targetY: number,
): Point {
  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;
  const w = element.width;
  const h = element.height;
  const skew = w * 0.2;

  const vertices: Point[] = [
    { x: element.x + skew, y: element.y },
    { x: element.x + w, y: element.y },
    { x: element.x + w - skew, y: element.y + h },
    { x: element.x, y: element.y + h },
  ];

  return getPolygonBoundaryPoint(cx, cy, vertices, targetX, targetY);
}

/**
 * For convex polygons: find where the ray from center→target
 * intersects the polygon boundary.
 */
function getPolygonBoundaryPoint(
  cx: number,
  cy: number,
  vertices: Point[],
  targetX: number,
  targetY: number,
): Point {
  const dx = targetX - cx;
  const dy = targetY - cy;

  if (dx === 0 && dy === 0) {
    return vertices[0];
  }

  let closest: Point | null = null;
  let minDist = Infinity;

  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    const hit = raySegmentIntersect(cx, cy, dx, dy, a, b);
    if (hit) {
      const d = (hit.x - cx) ** 2 + (hit.y - cy) ** 2;
      if (d < minDist) {
        minDist = d;
        closest = hit;
      }
    }
  }

  return closest ?? { x: cx, y: cy };
}

/**
 * Ray-segment intersection.
 * Ray starts at (ox, oy) with direction (dx, dy).
 * Segment from a to b.
 */
function raySegmentIntersect(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  a: Point,
  b: Point,
): Point | null {
  const sx = b.x - a.x;
  const sy = b.y - a.y;

  const denom = dx * sy - dy * sx;
  if (Math.abs(denom) < 1e-10) return null; // parallel

  const t = ((a.x - ox) * sy - (a.y - oy) * sx) / denom;
  const u = ((a.x - ox) * dy - (a.y - oy) * dx) / denom;

  if (t >= 0 && u >= 0 && u <= 1) {
    return {
      x: ox + t * dx,
      y: oy + t * dy,
    };
  }

  return null;
}
