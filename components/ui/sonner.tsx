"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-[18px] text-emerald-700 dark:text-emerald-400" />,
        info: <InfoIcon className="size-[18px] text-sky-700 dark:text-sky-400" />,
        warning: <TriangleAlertIcon className="size-[18px] text-amber-800 dark:text-amber-400" />,
        error: <OctagonXIcon className="size-[18px] text-red-700 dark:text-red-400" />,
        loading: <Loader2Icon className="size-[18px] animate-spin text-muted-foreground" />,
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "calc(var(--radius) + 6px)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: cn(
            "font-sans pr-11 shadow-lg backdrop-blur-md",
            "border-border/70 bg-card/95 text-card-foreground",
            "dark:border-border/50 dark:bg-card/90",
          ),
          title: "text-[0.9375rem] font-medium leading-snug tracking-tight text-foreground",
          description: "text-[13px] leading-relaxed text-muted-foreground",
          closeButton: cn(
            "!left-auto !right-3 !top-3 !translate-x-0 !translate-y-0",
            "h-7 w-7 rounded-full border border-border/70 bg-background/90 text-muted-foreground shadow-sm",
            "hover:bg-muted hover:text-foreground dark:bg-background/80",
          ),
          icon: "mt-0.5 self-start",
          success: "border-emerald-900/10 bg-gradient-to-br from-emerald-50/70 to-card dark:from-emerald-950/35 dark:to-card",
          error: "border-red-900/12 bg-gradient-to-br from-red-50/80 to-card dark:from-red-950/35 dark:to-card",
          warning: "border-amber-900/12 bg-gradient-to-br from-amber-50/80 to-card dark:from-amber-950/30 dark:to-card",
          info: "border-sky-900/10 bg-gradient-to-br from-sky-50/70 to-card dark:from-sky-950/30 dark:to-card",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
