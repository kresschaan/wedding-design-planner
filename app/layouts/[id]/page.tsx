import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseLayoutJson } from "@/lib/layout-json";
import type { LayoutRow } from "@/types/layout";
import { LayoutEditor } from "@/components/layout-editor/LayoutEditor";

interface LayoutPageProps {
  params: Promise<{ id: string }>;
}

export default async function LayoutPage({ params }: LayoutPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase.from("layouts").select("*").eq("id", id).maybeSingle();

  if (error || !data) {
    notFound();
  }

  const row: LayoutRow = {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    venue_name: data.venue_name,
    location: data.location,
    canvas_width: data.canvas_width,
    canvas_height: data.canvas_height,
    layout_json: parseLayoutJson(data.layout_json),
    created_at: data.created_at,
    updated_at: data.updated_at,
  };

  return (
    <main className="flex h-[100dvh] min-h-0 flex-col bg-[#f6f2ea]">
      <LayoutEditor key={row.id} initialRow={row} />
    </main>
  );
}
