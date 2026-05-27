"use client";

import { useCallback } from "react";
import type { CanvasObjectType } from "@/types/layout";
import { PALETTE_ITEMS } from "@/lib/palette-presets";
import { PaletteMiniThumb } from "@/components/layout-editor/palette-mini-thumb";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ObjectPaletteProps {
  variant?: "sidebar" | "sheet";
}

export function ObjectPalette({ variant = "sidebar" }: ObjectPaletteProps) {
  const onDragStart = useCallback((e: React.DragEvent, type: CanvasObjectType) => {
    e.dataTransfer.setData("application/x-wdp-type", type);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const root =
    variant === "sheet"
      ? "flex w-full flex-col gap-3"
      : "flex w-64 shrink-0 flex-col gap-3 rounded-xl border border-border/80 bg-card/80 p-3 shadow-sm backdrop-blur";

  return (
    <aside className={root}>
      {variant === "sidebar" ? (
        <div>
          <p className="text-sm font-semibold tracking-tight">Venue library</p>
          <p className="text-xs text-muted-foreground">
            Drag items onto the canvas. Top‑down shapes are optimized for desktop.
          </p>
        </div>
      ) : null}
      {variant === "sidebar" ? <Separator /> : null}
      <ScrollArea className="h-[min(70vh,640px)] pr-2">
        <ul className="flex flex-col gap-1.5">
          {PALETTE_ITEMS.map((item) => (
            <li key={item.type}>
              <button
                type="button"
                draggable
                onDragStart={(e) => onDragStart(e, item.type)}
                className="flex w-full cursor-grab items-center gap-3 rounded-lg border border-transparent bg-muted/40 px-2.5 py-2 text-left text-sm transition hover:border-border hover:bg-muted active:cursor-grabbing"
              >
                <PaletteMiniThumb type={item.type} />
                <span className="min-w-0 flex-1 leading-snug">{item.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </aside>
  );
}
