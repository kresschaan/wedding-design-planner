import Link from "next/link";
import { redirect } from "next/navigation";
import {
  isSupabaseConfigured,
} from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#f6f2ea]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(74,107,79,0.12), transparent 45%), radial-gradient(circle at 80% 10%, rgba(184,155,94,0.12), transparent 40%)",
        }}
      />
      <main className="relative z-10 mx-auto flex max-w-4xl flex-1 flex-col justify-center gap-10 px-6 py-16 text-center sm:text-left">
        {!isSupabaseConfigured() ? (
          <div
            role="status"
            className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-left text-sm text-amber-950 shadow-sm"
          >
            <p className="font-medium">Supabase is not configured yet</p>
            <p className="mt-1 text-amber-900/90">
              Add <code className="rounded bg-amber-100/80 px-1">.env.local</code> in the project root
              with <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{" "}
              (or legacy <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
              ). Copy from <code className="rounded bg-amber-100/80 px-1">.env.example</code>. Do not use
              secret keys in <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_*</code>. Then
              restart <code className="rounded bg-amber-100/80 px-1">npm run dev</code>.
            </p>
          </div>
        ) : null}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Garden estate</p>
          <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            Wedding floor plans for cool-climate ballrooms
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Drag-and-drop tables, stage, buffet, and guest seating on a soft cream canvas suited to
            garden-view ballrooms and mountain-resort receptions. Save every revision to Supabase with
            private row-level security.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
          <Link
            href="/signup"
            className={cn(buttonVariants({ size: "lg" }), "inline-flex min-w-[9rem] justify-center")}
          >
            Start planning
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "lg", variant: "outline" }),
              "inline-flex min-w-[9rem] justify-center bg-background/70",
            )}
          >
            Sign in
          </Link>
        </div>
        <ul className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
          <li className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur">
            <p className="font-medium text-foreground">2D venue designer</p>
            <p className="mt-1">Round tables, arch, dance floor, buffet, and more.</p>
          </li>
          <li className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur">
            <p className="font-medium text-foreground">Guest seating</p>
            <p className="mt-1">Seat counts and guest lists per table for your coordinator.</p>
          </li>
          <li className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur">
            <p className="font-medium text-foreground">Autosave</p>
            <p className="mt-1">Manual save plus gentle autosave while you iterate.</p>
          </li>
        </ul>
      </main>
    </div>
  );
}
