"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface EditorSidebarRailProps {
  side: "left" | "right";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: ReactNode;
  /** Accessible name / tooltip for the panel */
  label: string;
  /** Tiny caption under the icon when collapsed (e.g. "Library") */
  collapsedCaption: string;
  children: ReactNode;
}

/**
 * Collapsible editor chrome: narrow icon rail when closed (Canva/Figma-style).
 * The document canvas does not resize — only the viewport gains horizontal space.
 */
export function EditorSidebarRail({
  side,
  open,
  onOpenChange,
  icon,
  label,
  collapsedCaption,
  children,
}: EditorSidebarRailProps) {
  const isLeft = side === "left";

  if (!open) {
    return (
      <div className="flex w-11 shrink-0 flex-col items-center rounded-xl border border-border/80 bg-[#f6f2ea] py-2 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => onOpenChange(true)}
          aria-expanded={false}
          aria-label={`Open ${label}`}
          title={`Open ${label}`}
        >
          {icon}
        </Button>
        <span
          className="pointer-events-none mt-1 max-w-10 select-none text-center text-[10px] font-medium uppercase leading-tight tracking-wide text-muted-foreground"
          aria-hidden
        >
          {collapsedCaption}
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex shrink-0 flex-col">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "absolute top-2 z-10 size-8 bg-card/90 text-muted-foreground shadow-sm ring-1 ring-border/60 backdrop-blur hover:bg-card hover:text-foreground",
          isLeft ? "right-2" : "left-2",
        )}
        onClick={() => onOpenChange(false)}
        aria-expanded
        aria-label={`Collapse ${label}`}
        title={`Collapse ${label}`}
      >
        {isLeft ? (
          <ChevronLeft className="size-4" aria-hidden />
        ) : (
          <ChevronRight className="size-4" aria-hidden />
        )}
      </Button>
      {children}
    </div>
  );
}
