import type { CanvasObject } from "@/types/layout";

/**
 * Axis-aligned bounding box for a canvas object, accounting for rotation
 * with `transform-origin: center center` (same as `CanvasObjectView`).
 */
export function getObjectBoundingBox(o: CanvasObject): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const { x, y, width: w, height: h, rotation } = o;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const corners: readonly [number, number][] = [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
  ];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [dx, dy] of corners) {
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    const px = cx + rx;
    const py = cy + ry;
    minX = Math.min(minX, px);
    minY = Math.min(minY, py);
    maxX = Math.max(maxX, px);
    maxY = Math.max(maxY, py);
  }
  return { minX, minY, maxX, maxY };
}

export function aabbIntersects(
  a: { minX: number; minY: number; maxX: number; maxY: number },
  b: { minX: number; minY: number; maxX: number; maxY: number },
): boolean {
  return !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY);
}
