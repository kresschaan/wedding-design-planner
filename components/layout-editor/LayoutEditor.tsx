"use client";

import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import type { LayoutRow } from "@/types/layout";
import { useLayoutEditorStore } from "@/stores/layout-editor-store";
import {
  getLayoutEditorPanelPrefsServerSnapshot,
  getLayoutEditorPanelPrefsSnapshot,
  markLayoutEditorPanelPrefsHydrated,
  patchLayoutEditorPanelPrefs,
  subscribeLayoutEditorPanelPrefs,
} from "@/lib/layout-editor-panel-prefs";
import { TopToolbar } from "./TopToolbar";
import { ObjectPalette } from "./ObjectPalette";
import { CanvasWorkspace } from "./CanvasWorkspace";
import { LayoutBallroom3D } from "./ballroom-3d/LayoutBallroom3D";
import { Ballroom3DLeftPanel, Ballroom3DRightPanel } from "./ballroom-3d/Ballroom3DControls";
import { PropertiesPanel } from "./PropertiesPanel";
import { EditorSidebarRail } from "./editor-sidebar-rail";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Box, Camera, Library, SlidersHorizontal } from "lucide-react";

interface LayoutEditorProps {
  initialRow: LayoutRow;
  /** When false, saves omit `venue_setting` (DB column not present yet). */
  persistVenueSetting: boolean;
}

export function LayoutEditor({ initialRow, persistVenueSetting }: LayoutEditorProps) {
  const hydrateFromRow = useLayoutEditorStore((s) => s.hydrateFromRow);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [propsOpen, setPropsOpen] = useState(false);
  const editorDisplayMode = useLayoutEditorStore((s) => s.editorDisplayMode);
  const is3D = editorDisplayMode === "ballroom_3d";
  const panelPrefs = useSyncExternalStore(
    subscribeLayoutEditorPanelPrefs,
    getLayoutEditorPanelPrefsSnapshot,
    getLayoutEditorPanelPrefsServerSnapshot,
  );

  useLayoutEffect(() => {
    useLayoutEditorStore.setState({ persistVenueSettingToDb: persistVenueSetting });
  }, [persistVenueSetting]);

  useEffect(() => {
    markLayoutEditorPanelPrefsHydrated();
  }, []);

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
      {/* Sheets must not be flex siblings of the canvas row — Dialog Root can break horizontal layout */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="relative flex min-h-0 min-w-0 flex-1 gap-2 p-2 sm:p-3 lg:gap-3 lg:p-4">
          <div className="hidden shrink-0 lg:flex">
            <EditorSidebarRail
              side="left"
              open={panelPrefs.leftOpen}
              onOpenChange={(open) => patchLayoutEditorPanelPrefs({ leftOpen: open })}
              label={is3D ? "3D controls" : "Venue library"}
              collapsedCaption={is3D ? "3D" : "Library"}
              icon={
                is3D ? (
                  <Camera className="size-5" aria-hidden />
                ) : (
                  <Library className="size-5" aria-hidden />
                )
              }
            >
              {is3D ? <Ballroom3DLeftPanel /> : <ObjectPalette variant="sidebar" />}
            </EditorSidebarRail>
          </div>
          {editorDisplayMode === "floor_plan" ? <CanvasWorkspace /> : <LayoutBallroom3D />}
          <div className="hidden shrink-0 xl:flex">
            <EditorSidebarRail
              side="right"
              open={panelPrefs.rightOpen}
              onOpenChange={(open) => patchLayoutEditorPanelPrefs({ rightOpen: open })}
              label={is3D ? "3D scene" : "Properties"}
              collapsedCaption={is3D ? "Scene" : "Props"}
              icon={
                is3D ? (
                  <Box className="size-5" aria-hidden />
                ) : (
                  <SlidersHorizontal className="size-5" aria-hidden />
                )
              }
            >
              {is3D ? <Ballroom3DRightPanel /> : <PropertiesPanel />}
            </EditorSidebarRail>
          </div>
        </div>
        <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
          <SheetTrigger
            type="button"
            className={fab("left")}
            aria-label={is3D ? "Open 3D controls" : "Open venue library"}
          >
            {is3D ? <Camera className="size-5" /> : <Library className="size-5" />}
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(100%,20rem)] gap-0 p-0">
            <SheetHeader className="border-b border-border px-4 py-3 text-left">
              <SheetTitle>{is3D ? "3D controls" : "Venue library"}</SheetTitle>
            </SheetHeader>
            <div className="p-3">
              {is3D ? <Ballroom3DLeftPanel /> : <ObjectPalette variant="sheet" />}
            </div>
          </SheetContent>
        </Sheet>
        <Sheet open={propsOpen} onOpenChange={setPropsOpen}>
          <SheetTrigger
            type="button"
            className={fab("right")}
            aria-label={is3D ? "Open 3D scene details" : "Open properties"}
          >
            {is3D ? <Box className="size-5" /> : <SlidersHorizontal className="size-5" />}
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(100%,22rem)] gap-0 p-0">
            <SheetHeader className="border-b border-border px-4 py-3 text-left">
              <SheetTitle>{is3D ? "3D scene" : "Properties"}</SheetTitle>
            </SheetHeader>
            <div className="p-0">
              {is3D ? <Ballroom3DRightPanel /> : <PropertiesPanel embedded />}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
