import type { CanvasObject } from "@/types/layout";
import { isTableLikeType } from "@/types/layout";

const GAP = 12;

/** Top-left positions for chairs evenly spaced around a table-like object. */
export function computeChairRingPositions(
  table: CanvasObject,
  count: number,
  chairWidth: number,
  chairHeight: number,
): { x: number; y: number }[] {
  if (!isTableLikeType(table.type) || count <= 0) return [];

  const tcx = table.x + table.width / 2;
  const tcy = table.y + table.height / 2;
  const halfW = table.width / 2;
  const halfH = table.height / 2;
  const ch = Math.max(chairWidth, chairHeight);
  const cw = Math.min(chairWidth, chairHeight);

  const isRoundish = table.type === "round_table" || Math.abs(table.width - table.height) < 8;
  const rx = halfW + GAP + cw / 2;
  const ry = halfH + GAP + ch / 2;
  const rCircle = Math.max(halfW, halfH) + GAP + ch / 2;

  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2 - Math.PI / 2;
    let cx: number;
    let cy: number;
    if (isRoundish) {
      cx = tcx + rCircle * Math.cos(t);
      cy = tcy + rCircle * Math.sin(t);
    } else {
      cx = tcx + rx * Math.cos(t);
      cy = tcy + ry * Math.sin(t);
    }
    positions.push({
      x: Math.max(0, cx - chairWidth / 2),
      y: Math.max(0, cy - chairHeight / 2),
    });
  }
  return positions;
}
