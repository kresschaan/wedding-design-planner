"use client";

import { Box, Camera, Eye, Footprints, Lightbulb, MousePointer2, Orbit, Rotate3D } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useLayoutEditorStore,
  type BallroomCameraPreset,
  type BallroomNavMode,
} from "@/stores/layout-editor-store";
import { isTableLikeType } from "@/types/layout";
import { cn } from "@/lib/utils";

const CAMERA_PRESETS: { id: BallroomCameraPreset; label: string; help: string }[] = [
  { id: "overview", label: "Overview", help: "Open cutaway angle for checking the whole room." },
  { id: "entrance", label: "Entrance", help: "Lower view from the front of the ballroom." },
  { id: "top", label: "Top", help: "High plan-like view with depth and shadows." },
];

const NAV_MODES: { id: BallroomNavMode; label: string; help: string; icon: typeof Orbit }[] = [
  { id: "orbit", label: "Orbit", help: "Drag to rotate, W/A/S/D to move through the room, scroll to zoom.", icon: Orbit },
  {
    id: "walk",
    label: "Walk (first person)",
    help: "Drag to look around, scroll to glide forward, W/A/S/D to walk.",
    icon: Footprints,
  },
];

function ToggleRow({
  checked,
  onChange,
  label,
  help,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  help: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-background/70 p-3 text-sm shadow-sm">
      <input
        type="checkbox"
        className="mt-0.5 size-4 rounded border-input accent-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="min-w-0">
        <span className="block font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{help}</span>
      </span>
    </label>
  );
}

export function Ballroom3DLeftPanel() {
  const cameraPreset = useLayoutEditorStore((s) => s.ballroomCameraPreset);
  const setCameraPreset = useLayoutEditorStore((s) => s.setBallroomCameraPreset);
  const showWalls = useLayoutEditorStore((s) => s.ballroomShowWalls);
  const setShowWalls = useLayoutEditorStore((s) => s.setBallroomShowWalls);
  const showChandeliers = useLayoutEditorStore((s) => s.ballroomShowChandeliers);
  const setShowChandeliers = useLayoutEditorStore((s) => s.setBallroomShowChandeliers);
  const showFloorZones = useLayoutEditorStore((s) => s.ballroomShowFloorZones);
  const setShowFloorZones = useLayoutEditorStore((s) => s.setBallroomShowFloorZones);
  const navMode = useLayoutEditorStore((s) => s.ballroomNavMode);
  const setNavMode = useLayoutEditorStore((s) => s.setBallroomNavMode);
  const showPerson = useLayoutEditorStore((s) => s.ballroomShowPerson);
  const setShowPerson = useLayoutEditorStore((s) => s.setBallroomShowPerson);
  const autoChairs = useLayoutEditorStore((s) => s.ballroomAutoChairs);
  const setAutoChairs = useLayoutEditorStore((s) => s.setBallroomAutoChairs);

  return (
    <aside className="flex h-full w-72 max-w-[78vw] flex-col overflow-hidden rounded-xl border border-border/80 bg-[#fbf8f1] shadow-sm">
      <div className="border-b border-border/70 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Camera className="size-4" aria-hidden />
          3D Controls
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Adjust the preview camera and cutaway scene layers.
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-3">
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Navigation
          </p>
          <div className="grid grid-cols-2 gap-2">
            {NAV_MODES.map((mode) => {
              const active = navMode === mode.id;
              const Icon = mode.icon;
              return (
                <Button
                  key={mode.id}
                  type="button"
                  variant={active ? "secondary" : "outline"}
                  className={cn(
                    "h-auto w-full flex-col items-start gap-1 whitespace-normal px-3 py-2 text-left",
                    active && "ring-1 ring-primary/30",
                  )}
                  onClick={() => setNavMode(mode.id)}
                  aria-pressed={active}
                >
                  <span className="flex items-start gap-1.5 text-sm font-medium leading-tight">
                    <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    {mode.label}
                  </span>
                </Button>
              );
            })}
          </div>
          <p className="text-xs leading-snug text-muted-foreground">
            {navMode === "walk"
              ? "Drag the scene to look around, scroll to glide forward/back, W/A/S/D or arrows to walk."
              : "Drag to rotate, W/A/S/D or arrows to move through the room, right-drag to pan, scroll to zoom."}
          </p>
        </section>

        <Separator />

        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Camera preset
          </p>
          <div className="grid gap-2">
            {CAMERA_PRESETS.map((preset) => {
              const active = cameraPreset === preset.id;
              return (
                <Button
                  key={preset.id}
                  type="button"
                  variant={active ? "secondary" : "outline"}
                  className={cn(
                    "h-auto w-full justify-start whitespace-normal px-3 py-2 text-left",
                    active && "ring-1 ring-primary/30",
                  )}
                  onClick={() => setCameraPreset(preset.id)}
                  aria-pressed={active}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{preset.label}</span>
                    <span className="mt-0.5 block text-xs font-normal leading-snug text-muted-foreground wrap-break-word">
                      {preset.help}
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>
        </section>

        <Separator />

        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Scene layers
          </p>
          <ToggleRow
            checked={showWalls}
            onChange={setShowWalls}
            label="Cutaway walls"
            help="Back and side walls only. The front and ceiling stay open so the layout remains visible."
          />
          <ToggleRow
            checked={showChandeliers}
            onChange={setShowChandeliers}
            label="Warm chandeliers"
            help="William Penn-inspired ceiling light points for ballroom mood."
          />
          <ToggleRow
            checked={showFloorZones}
            onChange={setShowFloorZones}
            label="Floor zones"
            help="Shows large reserved / dance floor / aisle areas as thin translucent overlays."
          />
          <ToggleRow
            checked={autoChairs}
            onChange={setAutoChairs}
            label="Auto chairs around tables"
            help="Rings chairs around any table that has a seat count but no placed chairs."
          />
          <ToggleRow
            checked={showPerson}
            onChange={setShowPerson}
            label="Show a person (scale)"
            help="Places a standing guest in the room for a sense of scale. Hidden while walking."
          />
        </section>
      </div>
    </aside>
  );
}

export function Ballroom3DRightPanel() {
  const objects = useLayoutEditorStore((s) => s.document.objects);
  const tables = objects.filter((o) => isTableLikeType(o.type)).length;
  const chairs = objects.filter((o) => o.type === "chair").length;
  const decor = objects.filter(
    (o) => o.type === "plant_decor" || o.type === "flower_stand" || o.type === "photo_booth",
  ).length;

  return (
    <aside className="flex h-full w-72 max-w-[78vw] flex-col overflow-hidden rounded-xl border border-border/80 bg-[#fbf8f1] shadow-sm">
      <div className="border-b border-border/70 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Box className="size-4" aria-hidden />
          3D Scene
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Preview-only view generated from the current floor plan.
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-3">
        <section className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border/60 bg-background/70 p-2 text-center shadow-sm">
            <p className="text-lg font-semibold tabular-nums">{tables}</p>
            <p className="text-[11px] text-muted-foreground">Tables</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/70 p-2 text-center shadow-sm">
            <p className="text-lg font-semibold tabular-nums">{chairs}</p>
            <p className="text-[11px] text-muted-foreground">Chairs</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/70 p-2 text-center shadow-sm">
            <p className="text-lg font-semibold tabular-nums">{decor}</p>
            <p className="text-[11px] text-muted-foreground">Decor</p>
          </div>
        </section>

        <Separator />

        <section className="space-y-3 text-sm">
          <p className="flex items-start gap-2">
            <Rotate3D className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>
              <strong className="font-medium">Drag</strong> to orbit, or switch to{" "}
              <strong className="font-medium">Walk</strong> to explore in first person.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Footprints className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>
              In <strong className="font-medium">Walk</strong> mode: drag to look, scroll to glide,{" "}
              <strong className="font-medium">W/A/S/D</strong> or arrows to move.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <MousePointer2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>
              <strong className="font-medium">Scroll / pinch</strong> to zoom in or out.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Eye className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>
              Switch camera presets if the room feels too close or too flat.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>
              The 3D viewer mirrors the saved floor-plan objects. Edit placement in Floor plan mode.
            </span>
          </p>
        </section>
      </div>
    </aside>
  );
}
