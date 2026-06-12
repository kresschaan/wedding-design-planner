"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createLayoutAction } from "@/app/dashboard/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VENUE_DEFAULT_CANVAS, VENUE_PRESET_LABELS } from "@/lib/venue-settings";
import type { VenueSetting } from "@/types/layout";
import { VENUE_SETTINGS } from "@/types/layout";

export function NewLayoutDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [venue, setVenue] = useState<VenueSetting>("ballroom");
  const [canvasW, setCanvasW] = useState(VENUE_DEFAULT_CANVAS.ballroom.width);
  const [canvasH, setCanvasH] = useState(VENUE_DEFAULT_CANVAS.ballroom.height);

  function selectVenue(next: VenueSetting) {
    setVenue(next);
    const d = VENUE_DEFAULT_CANVAS[next];
    setCanvasW(d.width);
    setCanvasH(d.height);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("venueSetting", venue);
    fd.set("canvasWidth", String(canvasW));
    fd.set("canvasHeight", String(canvasH));
    setPending(true);
    const res = await createLayoutAction(fd);
    setPending(false);
    if ("error" in res) {
      toast.error("Could not create layout", { description: res.error });
      return;
    }
    toast.success("Layout created");
    setOpen(false);
    form.reset();
    selectVenue("ballroom");
    router.push(`/layouts/${res.id}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        type="button"
        className={cn(buttonVariants({ variant: "default" }))}
      >
        New layout
      </DialogTrigger>
      <DialogContent className="max-h-[min(92dvh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New wedding layout</DialogTitle>
          <DialogDescription>
            Pick a venue style, set the page size (you can change it anytime in the editor), and
            optionally load a starter template.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="nl-name">Layout name</Label>
            <Input id="nl-name" name="name" required placeholder="Spring reception — garden tent" />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Venue setting</legend>
            <p className="text-xs text-muted-foreground">
              Controls suggested page size, starter template, and which specialty items appear in
              the library. You can change this later in the editor.
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {VENUE_SETTINGS.map((v) => {
                const meta = VENUE_PRESET_LABELS[v];
                return (
                  <label
                    key={v}
                    className={cn(
                      "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-left text-sm transition hover:bg-muted/50",
                      venue === v ? "border-primary ring-1 ring-primary/30" : "border-border/80",
                    )}
                  >
                    <input
                      type="radio"
                      name="venueSettingRadio"
                      className="sr-only"
                      checked={venue === v}
                      onChange={() => selectVenue(v)}
                    />
                    <span className="font-medium">{meta.title}</span>
                    <span className="text-xs text-muted-foreground">{meta.description}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="nl-venue">Venue name</Label>
            <Input
              id="nl-venue"
              name="venueName"
              key={venue}
              defaultValue={VENUE_PRESET_LABELS[venue].defaultVenueName}
              placeholder="Venue"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nl-location">Location</Label>
            <Input
              id="nl-location"
              name="location"
              key={`${venue}-loc`}
              defaultValue={VENUE_PRESET_LABELS[venue].defaultLocation}
              placeholder="City / region"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nl-cw">Page width (px)</Label>
              <Input
                id="nl-cw"
                type="number"
                min={400}
                max={5600}
                step={20}
                required
                value={canvasW}
                onChange={(e) => setCanvasW(Number(e.target.value) || canvasW)}
              />
              <p className="text-[11px] text-muted-foreground">400–5600. Snap in editor if enabled.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nl-ch">Page height (px)</Label>
              <Input
                id="nl-ch"
                type="number"
                min={400}
                max={5600}
                step={20}
                required
                value={canvasH}
                onChange={(e) => setCanvasH(Number(e.target.value) || canvasH)}
              />
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
            <input
              id="nl-template"
              name="useTemplate"
              type="checkbox"
              value="true"
              defaultChecked
              className="mt-0.5 size-4 accent-primary"
            />
            <Label htmlFor="nl-template" className="text-sm font-normal leading-snug">
              Load starter template for this venue (tables, flow, and labels you can edit or
              delete). Uncheck for a completely blank page at the size above.
            </Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create layout"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
