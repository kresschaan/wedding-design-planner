"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Minus, Plus, Save, Sparkles } from "lucide-react";
import { useLayoutEditorStore } from "@/stores/layout-editor-store";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LAYOUT_AUTO_SAVE_INTERVAL_MINUTES,
  LAYOUT_AUTO_SAVE_INTERVAL_MS,
} from "@/lib/layout-auto-save";

export function TopToolbar() {
  const router = useRouter();
  const layoutId = useLayoutEditorStore((s) => s.layoutId);
  const name = useLayoutEditorStore((s) => s.name);
  const setMeta = useLayoutEditorStore((s) => s.setMeta);
  const dirty = useLayoutEditorStore((s) => s.dirty);
  const isSaving = useLayoutEditorStore((s) => s.isSaving);
  const lastSavedAt = useLayoutEditorStore((s) => s.lastSavedAt);
  const lastError = useLayoutEditorStore((s) => s.lastError);
  const zoom = useLayoutEditorStore((s) => s.zoom);
  const setZoom = useLayoutEditorStore((s) => s.setZoom);
  const showGrid = useLayoutEditorStore((s) => s.showGrid);
  const snapToGrid = useLayoutEditorStore((s) => s.snapToGrid);
  const canvasWidth = useLayoutEditorStore((s) => s.canvasWidth);
  const canvasHeight = useLayoutEditorStore((s) => s.canvasHeight);
  const setCanvasSize = useLayoutEditorStore((s) => s.setCanvasSize);
  const venueName = useLayoutEditorStore((s) => s.venueName);
  const location = useLayoutEditorStore((s) => s.location);

  const markSaved = useLayoutEditorStore((s) => s.markSaved);
  const setSaving = useLayoutEditorStore((s) => s.setSaving);
  const setError = useLayoutEditorStore((s) => s.setError);

  /** Reads latest editor state from the store so timers and callbacks stay correct without stale closures. */
  const saveFn = useCallback(
    async (source: "manual" | "auto") => {
      const s = useLayoutEditorStore.getState();
      if (!s.layoutId) return false;
      if (source === "auto" && (!s.dirty || s.isSaving)) return false;
      if (source === "manual" && s.isSaving) return false;

      setSaving(true);
      setError(null);
      const supabase = createClient();
      const payload = {
        name: s.name,
        venue_name: s.venueName,
        location: s.location,
        canvas_width: s.canvasWidth,
        canvas_height: s.canvasHeight,
        layout_json: s.document,
      };
      const { data, error } = await supabase
        .from("layouts")
        .update(payload)
        .eq("id", s.layoutId)
        .select("updated_at")
        .single();

      setSaving(false);
      if (error) {
        setError(error.message);
        toast.error("Could not save layout", { description: error.message });
        return false;
      }
      if (data?.updated_at) {
        markSaved(data.updated_at);
        if (source === "manual") {
          toast.success("Layout saved");
        } else {
          toast.success("Layout auto-saved", { duration: 2500 });
        }
        router.refresh();
        return true;
      }
      return false;
    },
    [markSaved, router, setError, setSaving],
  );

  useEffect(() => {
    if (!layoutId) return;
    const tick = () => {
      void saveFn("auto");
    };
    const id = window.setInterval(tick, LAYOUT_AUTO_SAVE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [layoutId, saveFn]);

  const savedLabel = lastSavedAt
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(lastSavedAt))
    : "Never";

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-border/80 bg-card/60 px-4 py-3 backdrop-blur">
      <Link
        href="/dashboard"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "inline-flex gap-2")}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Dashboard
      </Link>
      <Separator orientation="vertical" className="hidden h-8 sm:block" />
      <div className="flex min-w-[200px] flex-1 flex-col gap-1">
        <label className="sr-only" htmlFor="layout-name">
          Layout name
        </label>
        <Input
          id="layout-name"
          value={name}
          onChange={(e) => setMeta({ name: e.target.value })}
          className="h-9 max-w-md border-transparent bg-transparent text-base font-semibold shadow-none focus-visible:ring-1"
        />
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            {venueName} · {location}
          </span>
          {dirty ? (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3" aria-hidden />
              Unsaved changes
            </Badge>
          ) : (
            <Badge variant="outline">Saved · {savedLabel}</Badge>
          )}
          <span className="text-muted-foreground/80" title="Background save interval">
            Auto-save ~{LAYOUT_AUTO_SAVE_INTERVAL_MINUTES} min
          </span>
          {isSaving ? <span>Saving…</span> : null}
          {lastError ? <span className="text-destructive">{lastError}</span> : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-md border border-border bg-background">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-none"
            onClick={() => setZoom(zoom - 0.1)}
            aria-label="Zoom out"
          >
            <Minus className="size-4" />
          </Button>
          <span className="min-w-[3.5rem] text-center text-xs tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-none"
            onClick={() => setZoom(zoom + 0.1)}
            aria-label="Zoom in"
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <div
          className="hidden items-center gap-1.5 sm:flex"
          title="Canvas page size in pixels (400–5600). Same as Canvas → Dimensions."
        >
          <span className="text-xs font-medium text-muted-foreground">Page</span>
          <label className="sr-only" htmlFor="toolbar-canvas-w">
            Canvas width
          </label>
          <Input
            id="toolbar-canvas-w"
            type="number"
            min={400}
            max={5600}
            step={20}
            className="h-8 w-[4.25rem] px-2 text-xs tabular-nums"
            value={canvasWidth}
            onChange={(e) =>
              setCanvasSize(Number(e.target.value) || canvasWidth, canvasHeight)
            }
          />
          <span className="text-xs text-muted-foreground">×</span>
          <label className="sr-only" htmlFor="toolbar-canvas-h">
            Canvas height
          </label>
          <Input
            id="toolbar-canvas-h"
            type="number"
            min={400}
            max={5600}
            step={20}
            className="h-8 w-[4.25rem] px-2 text-xs tabular-nums"
            value={canvasHeight}
            onChange={(e) =>
              setCanvasSize(canvasWidth, Number(e.target.value) || canvasHeight)
            }
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Canvas
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Workspace</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showGrid}
              onCheckedChange={(v) => useLayoutEditorStore.setState({ showGrid: v })}
            >
              Show grid
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={snapToGrid}
              onCheckedChange={(v) => useLayoutEditorStore.setState({ snapToGrid: v })}
            >
              Snap to grid
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <p className="px-2 pb-1 text-xs text-muted-foreground">
              Drag on empty canvas to draw a selection box (Shift adds). Multi-select: ⌘/Ctrl+click.
              Keys (when not in a field): ⌘Z undo, ⇧⌘Z redo, ⌘C copy, ⌘V paste, Delete removes
              selection, Esc clears selection.
            </p>
            <DropdownMenuSeparator />
            <div className="space-y-2 px-2 py-1.5">
              <p className="text-xs text-muted-foreground">
                Dimensions (px). The page grows automatically when items approach an edge; max{" "}
                5600.
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  aria-label="Canvas width"
                  value={canvasWidth}
                  onChange={(e) =>
                    setCanvasSize(Number(e.target.value) || canvasWidth, canvasHeight)
                  }
                />
                <Input
                  type="number"
                  aria-label="Canvas height"
                  value={canvasHeight}
                  onChange={(e) =>
                    setCanvasSize(canvasWidth, Number(e.target.value) || canvasHeight)
                  }
                />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          type="button"
          onClick={() => void saveFn("manual")}
          disabled={isSaving || !dirty}
        >
          <Save className="mr-2 size-4" aria-hidden />
          Save now
        </Button>
      </div>
    </header>
  );
}
