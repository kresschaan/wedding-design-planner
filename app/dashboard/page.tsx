import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LayoutGrid, type DashboardLayout } from "@/components/dashboard/layout-grid";
import { NewLayoutDialog } from "@/components/dashboard/new-layout-dialog";
import { LogoutButton } from "@/components/auth/logout-button";
import { Separator } from "@/components/ui/separator";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("layouts")
    .select("id,name,venue_name,location,updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
        <p className="text-destructive">
          Could not load layouts. Confirm the <code className="rounded bg-muted px-1">layouts</code>{" "}
          table exists and RLS policies are applied.
        </p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </main>
    );
  }

  const layouts = (data ?? []) as DashboardLayout[];

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Floor plans</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Your layouts</h1>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Plan reception seating, ceremony flow, and venue décor in a calm, top‑down workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NewLayoutDialog />
          <LogoutButton />
        </div>
      </header>
      <Separator />
      <LayoutGrid layouts={layouts} />
    </main>
  );
}
