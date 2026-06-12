"use client";

import type { CanvasObject } from "@/types/layout";
import { isTableLikeType } from "@/types/layout";
import { cn } from "@/lib/utils";
import { getChairSlotTopLefts } from "@/lib/table-chair-slots";

const MARKER_CHAIR_W = 28;
const MARKER_CHAIR_H = 28;

/** Seat snap guides: dashed circles around the table when seat count is set; highlights while dragging a chair. */
export function TableChairSlotMarkers({
  table,
  highlightIndex,
  chairWidth,
  chairHeight,
}: {
  table: CanvasObject;
  highlightIndex: number | null;
  /** When dragging a chair, match slot geometry to that chair (defaults to 28). */
  chairWidth?: number;
  chairHeight?: number;
}) {
  if (!isTableLikeType(table.type)) return null;

  const cw = chairWidth ?? MARKER_CHAIR_W;
  const ch = chairHeight ?? MARKER_CHAIR_H;
  const slots = getChairSlotTopLefts(table, cw, ch);
  if (slots.length === 0) return null;

  /** Visible ring diameter scales with chair footprint so it stays readable when zoomed. */
  const ring = Math.min(30, Math.max(14, Math.min(cw, ch) * 0.54));

  return (
    <>
      {slots.map((pos, i) => {
        const cx = pos.x - table.x + cw / 2;
        const cy = pos.y - table.y + ch / 2;
        const active = highlightIndex === i;
        const half = ring / 2;
        return (
          <div
            key={i}
            className={cn(
              "pointer-events-none absolute rounded-full border-2 border-dashed transition-[transform,colors,box-shadow] duration-150",
              active
                ? "z-5 border-amber-600 bg-amber-300/45 shadow-[0_0_0_4px_rgba(217,119,6,0.28)]"
                : "z-1 border-[#172554]/40 bg-white/30",
            )}
            style={{
              left: cx - half,
              top: cy - half,
              width: ring,
              height: ring,
              transform: active ? "scale(1.25)" : "scale(1)",
            }}
            aria-hidden
          />
        );
      })}
    </>
  );
}
