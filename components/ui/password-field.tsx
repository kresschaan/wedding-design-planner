"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type PasswordFieldProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  /** Visible label text for the toggle (screen readers). */
  label: string;
};

/**
 * Password input with show/hide toggle. Forwards ref for react-hook-form `register`.
 */
const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ className, label, id, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          className={cn("pr-9", className)}
          {...props}
        />
        <button
          type="button"
          className="absolute inset-e-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
    );
  },
);
PasswordField.displayName = "PasswordField";

export { PasswordField };
