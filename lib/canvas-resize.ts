import type { CanvasObjectType } from "@/types/layout";

export type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/** Resize keeps width === height (circles / square chairs stay proportional). */
export function isUniformScaleResizeType(type: CanvasObjectType): boolean {
  return type === "round_table" || type === "chair";
}

/**
 * Uniform scale from center: keeps a perfect square so round tables stay circular
 * and chairs stay square while growing or shrinking from any handle.
 */
export function computeUniformSquareResize(
  edge: ResizeEdge,
  orig: { x: number; y: number; w: number; h: number },
  dCanvasX: number,
  dCanvasY: number,
  minSize: number,
): { x: number; y: number; w: number; h: number } {
  const next = computeResizedRect(edge, orig, dCanvasX, dCanvasY, minSize, minSize);
  const s = Math.max(next.w, next.h, minSize);
  const cx = orig.x + orig.w / 2;
  const cy = orig.y + orig.h / 2;
  return {
    x: cx - s / 2,
    y: cy - s / 2,
    w: s,
    h: s,
  };
}

export function computeResizedRect(
  edge: ResizeEdge,
  orig: { x: number; y: number; w: number; h: number },
  dCanvasX: number,
  dCanvasY: number,
  minW: number,
  minH: number,
): { x: number; y: number; w: number; h: number } {
  const { x: ox, y: oy, w: ow, h: oh } = orig;
  const north = edge === "n" || edge === "nw" || edge === "ne";
  const south = edge === "s" || edge === "sw" || edge === "se";
  const east = edge === "e" || edge === "ne" || edge === "se";
  const west = edge === "w" || edge === "nw" || edge === "sw";

  let x = ox;
  let y = oy;
  let w = ow;
  let h = oh;

  if (east) w = ow + dCanvasX;
  if (west) {
    w = ow - dCanvasX;
    x = ox + dCanvasX;
  }
  if (south) h = oh + dCanvasY;
  if (north) {
    h = oh - dCanvasY;
    y = oy + dCanvasY;
  }

  if (w < minW) {
    if (west) x = ox + ow - minW;
    w = minW;
  }
  if (h < minH) {
    if (north) y = oy + oh - minH;
    h = minH;
  }

  return { x, y, w, h };
}
