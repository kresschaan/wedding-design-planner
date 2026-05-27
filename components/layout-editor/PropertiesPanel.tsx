"use client";

import { useLayoutEditorStore } from "@/stores/layout-editor-store";
import { isChairType, isTableLikeType } from "@/types/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isUniformScaleResizeType } from "@/lib/canvas-resize";

export function GuestAssignmentPanel() {
  const selectedIds = useLayoutEditorStore((s) => s.selectedIds);
  const objects = useLayoutEditorStore((s) => s.document.objects);
  const updateObject = useLayoutEditorStore((s) => s.updateObject);

  const leadId = selectedIds[selectedIds.length - 1];
  const obj = objects.find((o) => o.id === leadId);
  if (!obj) {
    return (
      <p className="text-sm text-muted-foreground">
        Select an object on the canvas to edit guest details.
      </p>
    );
  }

  if (isChairType(obj.type)) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Assign one guest to this chair. Table guest lists stay on each table&apos;s Guests tab.
        </p>
        <div className="space-y-2">
          <Label htmlFor="chairGuest">Guest name</Label>
          <Input
            id="chairGuest"
            autoComplete="off"
            placeholder="e.g. Maria Santos"
            value={obj.meta.guestName ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              updateObject(obj.id, {
                meta: { guestName: raw.trim() === "" ? undefined : raw },
              });
            }}
          />
        </div>
      </div>
    );
  }

  if (!isTableLikeType(obj.type)) {
    return (
      <p className="text-sm text-muted-foreground">
        Guest lists apply to tables, buffets, bars, and similar furniture. Select a table or a chair
        on the canvas.
      </p>
    );
  }

  const guestText = (obj.meta.guestNames ?? []).join("\n");

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-2">
        <Label htmlFor="seatCount">Seat count</Label>
        <Input
          id="seatCount"
          type="number"
          min={0}
          max={999}
          value={obj.meta.seatCount ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            updateObject(obj.id, {
              meta: {
                seatCount: v === "" ? undefined : Math.max(0, Number.parseInt(v, 10) || 0),
              },
            });
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="guests">Guest names (one per line)</Label>
        <Textarea
          id="guests"
          rows={8}
          value={guestText}
          onChange={(e) => {
            const lines = e.target.value
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean);
            updateObject(obj.id, { meta: { guestNames: lines } });
          }}
          placeholder={"Maria Santos\nJuan Dela Cruz"}
        />
      </div>
    </div>
  );
}

export function PropertiesPanel({ embedded = false }: { embedded?: boolean }) {
  const selectedIds = useLayoutEditorStore((s) => s.selectedIds);
  const objects = useLayoutEditorStore((s) => s.document.objects);
  const updateObject = useLayoutEditorStore((s) => s.updateObject);
  const deleteSelection = useLayoutEditorStore((s) => s.deleteSelection);
  const duplicateSelection = useLayoutEditorStore((s) => s.duplicateSelection);

  const leadId = selectedIds[selectedIds.length - 1];
  const obj = objects.find((o) => o.id === leadId);

  if (!obj) {
    return (
      <aside
        className={
          embedded
            ? "flex w-full flex-col gap-3 p-4"
            : "flex w-80 shrink-0 flex-col gap-3 rounded-xl border border-border/80 bg-card/80 p-4 shadow-sm"
        }
      >
        <p className="text-sm font-medium">Properties</p>
        <p className="text-sm text-muted-foreground">
          Select an object on the canvas to edit its details, or drag a new item from the library.
        </p>
      </aside>
    );
  }

  return (
    <aside
      className={
        embedded
          ? "flex w-full flex-col gap-0 bg-transparent"
          : "flex w-80 shrink-0 flex-col gap-3 rounded-xl border border-border/80 bg-card/80 p-0 shadow-sm"
      }
    >
      <div className="border-b border-border/70 px-4 py-3">
        <p className="text-sm font-semibold">Properties</p>
        <p className="text-xs capitalize text-muted-foreground">
          {obj.type.replaceAll("_", " ")}
          {selectedIds.length > 1 ? (
            <span className="block font-normal text-muted-foreground">
              {selectedIds.length} selected — editing the lead item; Delete / Duplicate apply to all.
            </span>
          ) : null}
        </p>
      </div>
      <Tabs defaultValue="props" className="flex flex-1 flex-col gap-0">
        <TabsList className="mx-4 mt-2 grid w-auto grid-cols-2">
          <TabsTrigger value="props">Layout</TabsTrigger>
          <TabsTrigger value="guests">Guests</TabsTrigger>
        </TabsList>
        <TabsContent value="props" className="mt-0 flex-1 outline-none">
          <ScrollArea className="h-[min(70vh,640px)]">
            <div className="space-y-4 px-4 pb-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={obj.label}
                  onChange={(e) => updateObject(obj.id, { label: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {isUniformScaleResizeType(obj.type) ? (
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="size">Size (width &amp; height)</Label>
                    <Input
                      id="size"
                      type="number"
                      min={8}
                      value={Math.round(obj.width)}
                      onChange={(e) => {
                        const v = Math.max(8, Number(e.target.value) || 8);
                        updateObject(obj.id, { width: v, height: v });
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Kept square so round tables stay circular and chairs don&apos;t stretch.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="w">Width</Label>
                      <Input
                        id="w"
                        type="number"
                        min={8}
                        value={Math.round(obj.width)}
                        onChange={(e) =>
                          updateObject(obj.id, { width: Math.max(8, Number(e.target.value) || 8) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="h">Height</Label>
                      <Input
                        id="h"
                        type="number"
                        min={8}
                        value={Math.round(obj.height)}
                        onChange={(e) =>
                          updateObject(obj.id, { height: Math.max(8, Number(e.target.value) || 8) })
                        }
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rot">Rotation (deg)</Label>
                <Input
                  id="rot"
                  type="number"
                  value={Math.round(obj.rotation)}
                  onChange={(e) =>
                    updateObject(obj.id, { rotation: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    className="h-10 w-14 cursor-pointer p-1"
                    value={obj.color.startsWith("#") ? obj.color : "#cccccc"}
                    onChange={(e) => updateObject(obj.id, { color: e.target.value })}
                  />
                  <Input
                    aria-label="Color hex value"
                    value={obj.color}
                    onChange={(e) => updateObject(obj.id, { color: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={obj.meta.notes ?? ""}
                  onChange={(e) =>
                    updateObject(obj.id, { meta: { notes: e.target.value || undefined } })
                  }
                />
              </div>
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => duplicateSelection()}>
                  Duplicate{selectedIds.length > 1 ? ` (${selectedIds.length})` : ""}
                </Button>
                <Button type="button" variant="destructive" onClick={() => deleteSelection()}>
                  Delete{selectedIds.length > 1 ? ` (${selectedIds.length})` : ""}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="guests" className="mt-0 flex-1 outline-none">
          <ScrollArea className="h-[min(70vh,640px)]">
            <div className="px-4 pb-4 pt-2">
              <GuestAssignmentPanel />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
