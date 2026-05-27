"use client";

import { useEffect, useState } from "react";
import type { LayoutRow } from "@/types/layout";
import { useLayoutEditorStore } from "@/stores/layout-editor-store";
import { TopToolbar } from "./TopToolbar";
import { ObjectPalette } from "./ObjectPalette";
import { CanvasWorkspace } from "./CanvasWorkspace";
import { PropertiesPanel } from "./PropertiesPanel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Library, SlidersHorizontal } from "lucide-react";

interface LayoutEditorProps {
  initialRow: LayoutRow;
}

export function LayoutEditor({ initialRow }: LayoutEditorProps) {
  const hydrateFromRow = useLayoutEditorStore((s) => s.hydrateFromRow);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);

  useEffect(() => {
    hydrateFromRow(initialRow);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset store when switching layouts (id)
  }, [hydrateFromRow, initialRow.id]);

  useEffect(() => {
    const isFormField = (t: EventTarget | null) => {
      if (!(t instanceof HTMLElement)) return false;
      if (t.isContentEditable) return true;
      const tag = t.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (isFormField(e.target)) return;

      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (mod && key === "z" && !e.shiftKey) {
        e.preventDefault();
        useLayoutEditorStore.getState().undo();
        return;
      }
      if (mod && (key === "y" || (key === "z" && e.shiftKey))) {
        e.preventDefault();
        useLayoutEditorStore.getState().redo();
        return;
      }
      if (mod && key === "c") {
        e.preventDefault();
        useLayoutEditorStore.getState().copySelection();
        return;
      }
      if (mod && key === "v") {
        e.preventDefault();
        void useLayoutEditorStore.getState().pasteClipboard();
        return;
      }
      if (key === "escape") {
        useLayoutEditorStore.getState().clearSelection();
        return;
      }
      if (key === "backspace" || key === "delete") {
        e.preventDefault();
        useLayoutEditorStore.getState().deleteSelection();
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fab = (side: "left" | "right") =>
    cn(
      buttonVariants({ variant: "secondary", size: "icon" }),
      "fixed z-20 h-11 w-11 shadow-md",
      side === "left" ? "bottom-5 left-5 lg:hidden" : "bottom-5 right-5 xl:hidden",
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f6f2ea]">
      <TopToolbar />
      <div className="relative flex min-h-0 flex-1 gap-3 p-3 lg:p-4">
        <div className="hidden lg:flex">
          <ObjectPalette variant="sidebar" />
        </div>
        <CanvasWorkspace />
        <div className="hidden xl:flex">
          <PropertiesPanel />
        </div>
        <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
          <SheetTrigger
            type="button"
            className={fab("left")}
            aria-label="Open venue library"
          >
            <Library className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(100%,20rem)] gap-0 p-0">
            <SheetHeader className="border-b border-border px-4 py-3 text-left">
              <SheetTitle>Venue library</SheetTitle>
            </SheetHeader>
            <div className="p-3">
              <ObjectPalette variant="sheet" />
            </div>
          </SheetContent>
        </Sheet>
        <Sheet open={propsOpen} onOpenChange={setPropsOpen}>
          <SheetTrigger
            type="button"
            className={fab("right")}
            aria-label="Open properties"
          >
            <SlidersHorizontal className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(100%,22rem)] gap-0 p-0">
            <SheetHeader className="border-b border-border px-4 py-3 text-left">
              <SheetTitle>Properties</SheetTitle>
            </SheetHeader>
            <div className="p-0">
              <PropertiesPanel embedded />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
