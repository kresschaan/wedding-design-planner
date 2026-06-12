"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useLayoutEditorStore } from "@/stores/layout-editor-store";
import { Button } from "@/components/ui/button";
import { requiredAttributions } from "@/lib/layout-3d/model-registry";

const LayoutBallroom3DCanvas = dynamic(
  () =>
    import("./LayoutBallroom3DCanvas").then((m) => ({
      default: m.LayoutBallroom3DCanvas,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[min(70vh,560px)] flex-1 flex-col items-center justify-center gap-3 bg-[#e8dfd6] text-muted-foreground">
        <Loader2 className="size-10 animate-spin text-[#8b7355]" aria-hidden />
        <p className="text-sm font-medium text-[#4a4238]">Loading ballroom preview…</p>
      </div>
    ),
  },
);

export function LayoutBallroom3D() {
  const setEditorDisplayMode = useLayoutEditorStore((s) => s.setEditorDisplayMode);
  const attributions = requiredAttributions();

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/80 bg-[#f6f2ea] shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-card/50 px-3 py-2.5 backdrop-blur-sm">
        <div>
          <p className="text-sm font-semibold text-foreground">Ballroom 3D</p>
          <p className="text-xs text-muted-foreground">
            Warm archviz-style lighting, procedural wood and plaster, soft shadows · drag to orbit · scroll to zoom
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={() => setEditorDisplayMode("floor_plan")}>
          Back to floor plan
        </Button>
      </div>
      <div className="relative min-h-0 flex-1">
        <LayoutBallroom3DCanvas />
      </div>
      <div className="border-t border-border/60 bg-muted/20 px-3 py-2 text-center text-[11px] text-muted-foreground">
        <p>
          Preview only — switch to <strong className="font-medium text-foreground">Floor plan</strong> to edit
          placement.
        </p>
        {attributions.length > 0 ? (
          <p className="mt-0.5 text-[10px] text-muted-foreground/80">
            3D furniture:{" "}
            {attributions.map((a, i) => (
              <span key={a.title}>
                {i > 0 ? " · " : ""}
                {a.title} ({a.license}) — {a.credit}
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </div>
  );
}
