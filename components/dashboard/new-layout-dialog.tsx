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

export function NewLayoutDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New wedding layout</DialogTitle>
          <DialogDescription>
            Start from a sample ballroom reception layout or a blank canvas.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="nl-name">Layout name</Label>
            <Input id="nl-name" name="name" required placeholder="Reception — Grand ballroom" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nl-venue">Venue name</Label>
            <Input
              id="nl-venue"
              name="venueName"
              defaultValue="Garden estate venue"
              placeholder="Venue"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nl-location">Location</Label>
            <Input
              id="nl-location"
              name="location"
              defaultValue="Philippines"
              placeholder="City / region"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
            <input
              id="nl-template"
              name="useTemplate"
              type="checkbox"
              value="true"
              defaultChecked
              className="size-4 accent-primary"
            />
            <Label htmlFor="nl-template" className="text-sm font-normal leading-snug">
              Include sample reception template (rounds, stage, buffet, aisle, garden exit)
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
