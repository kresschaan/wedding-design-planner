"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { duplicateLayoutAction, deleteLayoutAction } from "@/app/dashboard/actions";
import { VENUE_PRESET_LABELS, parseVenueSetting } from "@/lib/venue-settings";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface DashboardLayout {
  id: string;
  name: string;
  venue_name: string;
  location: string;
  /** Present after DB migration `20250529130000_layout_venue_setting.sql` */
  venue_setting?: string;
  updated_at: string;
}

interface LayoutGridProps {
  layouts: DashboardLayout[];
}

export function LayoutGrid({ layouts }: LayoutGridProps) {
  const router = useRouter();
  const [pendingDup, startDup] = useTransition();
  const [pendingDel, startDel] = useTransition();

  function duplicate(id: string) {
    startDup(async () => {
      const res = await duplicateLayoutAction(id);
      if ("error" in res) {
        toast.error("Duplicate failed", { description: res.error });
        return;
      }
      toast.success("Layout duplicated");
      router.push(`/layouts/${res.id}`);
      router.refresh();
    });
  }

  function remove(id: string) {
    startDel(async () => {
      const res = await deleteLayoutAction(id);
      if ("error" in res) {
        toast.error("Delete failed", { description: res.error });
        return;
      }
      toast.success("Layout deleted");
      router.refresh();
    });
  }

  if (layouts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-card/60 p-10 text-center shadow-inner">
        <p className="text-lg font-medium">No layouts yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Create your first floor plan to arrange tables, stage, buffet, and guest seating.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {layouts.map((layout) => {
        const updated = new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(layout.updated_at));

        return (
          <li key={layout.id}>
            <Card className="h-full border-border/80 bg-card/90 shadow-sm backdrop-blur transition hover:border-primary/40">
              <CardHeader className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-heading text-lg leading-snug">{layout.name}</CardTitle>
                  <Badge variant="secondary" className="shrink-0 text-[10px] uppercase tracking-wide">
                    Saved
                  </Badge>
                </div>
                <CardDescription className="flex flex-col gap-1.5 line-clamp-2">
                  <span>
                    {layout.venue_name} · {layout.location}
                  </span>
                  {layout.venue_setting ? (
                    <Badge variant="outline" className="w-fit text-[10px] font-normal tracking-wide">
                      {VENUE_PRESET_LABELS[parseVenueSetting(layout.venue_setting)].title}
                    </Badge>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">Last updated {updated}</CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Link
                  href={`/layouts/${layout.id}`}
                  className={cn(buttonVariants({ size: "sm" }), "inline-flex")}
                >
                  Open editor
                </Link>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={pendingDup}
                  onClick={() => duplicate(layout.id)}
                >
                  Duplicate
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger
                    type="button"
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                    disabled={pendingDel}
                  >
                    Delete
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this layout?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes{" "}
                        <span className="font-medium text-foreground">{layout.name}</span> from your
                        account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                      <AlertDialogAction type="button" onClick={() => remove(layout.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
