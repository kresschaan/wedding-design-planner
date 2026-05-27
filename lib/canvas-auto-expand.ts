import type { CanvasObject } from "@/types/layout";
import { getObjectBoundingBox } from "@/lib/canvas-object-bounds";

/** Breathing room past the furthest content (draw.io–style growth). */
export const CANVAS_CONTENT_MARGIN = 120;

/** When anything crosses the top/left edge, shift back with this inset. */
const EDGE_RECOVERY_MARGIN = 40;

const GRID = 20;

function snapUp(n: number): number {
  return Math.ceil(n / GRID) * GRID;
}

function snapValue(value: number, snapToGrid: boolean): number {
  if (!snapToGrid) return Math.round(value);
  return Math.round(value / GRID) * GRID;
}

/**
 * Grows canvas (and optionally shifts objects) so all object bounds stay inside
 * the page with margin. Never shrinks the canvas automatically.
 */
export function reconcileCanvasWithObjects(
  canvasWidth: number,
  canvasHeight: number,
  objects: CanvasObject[],
  snapToGrid: boolean,
): { canvasWidth: number; canvasHeight: number; objects: CanvasObject[] } | null {
  if (objects.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const o of objects) {
    const b = getObjectBoundingBox(o);
    minX = Math.min(minX, b.minX);
    minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX);
    maxY = Math.max(maxY, b.maxY);
  }

  let shiftX = 0;
  let shiftY = 0;
  if (minX < 0) {
    shiftX = snapValue(EDGE_RECOVERY_MARGIN - minX, snapToGrid);
  }
  if (minY < 0) {
    shiftY = snapValue(EDGE_RECOVERY_MARGIN - minY, snapToGrid);
  }

  let nextObjects = objects;
  if (shiftX !== 0 || shiftY !== 0) {
    nextObjects = objects.map((o) => ({
      ...o,
      x: o.x + shiftX,
      y: o.y + shiftY,
    }));
    minX += shiftX;
    maxX += shiftX;
    minY += shiftY;
    maxY += shiftY;
  }

  const neededW = snapUp(maxX + CANVAS_CONTENT_MARGIN);
  const neededH = snapUp(maxY + CANVAS_CONTENT_MARGIN);
  const grownW = Math.max(canvasWidth, neededW, canvasWidth + shiftX);
  const grownH = Math.max(canvasHeight, neededH, canvasHeight + shiftY);

  const sameObjects = nextObjects === objects;
  const sameSize = grownW === canvasWidth && grownH === canvasHeight;

  if (sameObjects && sameSize) return null;

  return {
    canvasWidth: grownW,
    canvasHeight: grownH,
    objects: nextObjects,
  };
}
