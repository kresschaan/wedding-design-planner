import type { CanvasObject } from "@/types/layout";
import { isTableLikeType } from "@/types/layout";
import { computeChairRingPositions } from "@/lib/chair-ring-layout";

/** Max distance (canvas px) from a slot center to snap a chair on drop. */
export const CHAIR_TABLE_SNAP_RADIUS = 56;
/** Treat a slot as taken if another chair’s center is within this distance of the slot center. */
export const CHAIR_SLOT_OCCUPY_RADIUS = 22;

/** Configured seats (1–24) for ring layout; 0 if unset or not a table-like object. */
export function getConfiguredChairSlotCount(table: CanvasObject): number {
  if (!isTableLikeType(table.type)) return 0;
  const raw = table.meta.seatCount;
  if (raw == null || raw <= 0) return 0;
  return Math.min(24, Math.max(1, Math.round(raw)));
}

/** Top-left positions for chair slots (same geometry as “Ring chairs”). Empty when seat count is not set. */
export function getChairSlotTopLefts(
  table: CanvasObject,
  chairWidth: number,
  chairHeight: number,
): { x: number; y: number }[] {
  const n = getConfiguredChairSlotCount(table);
  if (n <= 0) return [];
  return computeChairRingPositions(table, n, chairWidth, chairHeight);
}

function hypot(dx: number, dy: number) {
  return Math.hypot(dx, dy);
}

export function isChairSlotUnoccupied(
  objects: CanvasObject[],
  excludeIds: Set<string>,
  slotTopLeftX: number,
  slotTopLeftY: number,
  chairWidth: number,
  chairHeight: number,
): boolean {
  const scx = slotTopLeftX + chairWidth / 2;
  const scy = slotTopLeftY + chairHeight / 2;
  for (const o of objects) {
    if (o.type !== "chair" || excludeIds.has(o.id)) continue;
    const ox = o.x + o.width / 2;
    const oy = o.y + o.height / 2;
    if (hypot(ox - scx, oy - scy) < CHAIR_SLOT_OCCUPY_RADIUS) return false;
  }
  return true;
}

/** Nearest free slot for snap preview while dragging (single chair only at call site). */
export function findChairSlotSnapPreview(
  chair: CanvasObject,
  objects: CanvasObject[],
  dragIds: Set<string>,
): { tableId: string; slotIndex: number } | null {
  if (chair.type !== "chair") return null;
  const cw = chair.width;
  const ch = chair.height;
  const ccx = chair.x + cw / 2;
  const ccy = chair.y + ch / 2;

  const tables = objects.filter((o) => isTableLikeType(o.type));
  let best: { tableId: string; slotIndex: number; d: number } | null = null;

  for (const table of tables) {
    const slots = getChairSlotTopLefts(table, cw, ch);
    for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
      const pos = slots[slotIndex]!;
      const scx = pos.x + cw / 2;
      const scy = pos.y + ch / 2;
      const d = hypot(ccx - scx, ccy - scy);
      if (d >= CHAIR_TABLE_SNAP_RADIUS) continue;
      if (!isChairSlotUnoccupied(objects, dragIds, pos.x, pos.y, cw, ch)) continue;
      if (!best || d < best.d) {
        best = { tableId: table.id, slotIndex, d };
      }
    }
  }
  return best ? { tableId: best.tableId, slotIndex: best.slotIndex } : null;
}

/** Snap position for a single chair after drag (exact slot coordinates, no grid snap). */
export function findChairSlotSnapPosition(
  chair: CanvasObject,
  objects: CanvasObject[],
  dragIds: Set<string>,
): { x: number; y: number } | null {
  const preview = findChairSlotSnapPreview(chair, objects, dragIds);
  if (!preview) return null;
  const table = objects.find((o) => o.id === preview.tableId);
  if (!table) return null;
  const slots = getChairSlotTopLefts(table, chair.width, chair.height);
  const pos = slots[preview.slotIndex];
  if (!pos) return null;
  if (!isChairSlotUnoccupied(objects, dragIds, pos.x, pos.y, chair.width, chair.height)) {
    return null;
  }
  return { x: pos.x, y: pos.y };
}
