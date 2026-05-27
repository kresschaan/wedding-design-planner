"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  bccSampleDocument,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
  emptyLayoutDocument,
} from "@/lib/sample-layout";
import type { LayoutJsonDocument } from "@/types/layout";

export async function createLayoutAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" as const };
  }

  const name = String(formData.get("name") ?? "").trim();
  const venueName = String(formData.get("venueName") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const useTemplate = Boolean(formData.get("useTemplate"));

  if (!name) {
    return { error: "Name is required" as const };
  }

  const layoutJson: LayoutJsonDocument = useTemplate
    ? bccSampleDocument()
    : emptyLayoutDocument();

  const { data, error } = await supabase
    .from("layouts")
    .insert({
      user_id: user.id,
      name,
      venue_name: venueName || "Garden estate venue",
      location: location || "Philippines",
      canvas_width: DEFAULT_CANVAS_WIDTH,
      canvas_height: DEFAULT_CANVAS_HEIGHT,
      layout_json: layoutJson,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create layout" as const };
  }

  revalidatePath("/dashboard");
  return { ok: true as const, id: data.id };
}

export async function duplicateLayoutAction(layoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" as const };
  }

  const { data: row, error: fetchError } = await supabase
    .from("layouts")
    .select("*")
    .eq("id", layoutId)
    .single();

  if (fetchError || !row) {
    return { error: fetchError?.message ?? "Layout not found" as const };
  }

  const { data, error } = await supabase
    .from("layouts")
    .insert({
      user_id: user.id,
      name: `Copy of ${row.name}`,
      venue_name: row.venue_name,
      location: row.location,
      canvas_width: row.canvas_width,
      canvas_height: row.canvas_height,
      layout_json: row.layout_json as LayoutJsonDocument,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Duplicate failed" as const };
  }

  revalidatePath("/dashboard");
  return { ok: true as const, id: data.id };
}

export async function deleteLayoutAction(layoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" as const };
  }

  const { error } = await supabase.from("layouts").delete().eq("id", layoutId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}
