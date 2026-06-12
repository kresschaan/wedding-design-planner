"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { emptyLayoutDocument } from "@/lib/sample-layout";
import type { LayoutJsonDocument } from "@/types/layout";
import {
  VENUE_DEFAULT_CANVAS,
  clampCanvasDimension,
  initialLayoutDocumentForVenue,
  parseVenueSetting,
} from "@/lib/venue-settings";
import { layoutsTableHasVenueSettingColumn } from "@/lib/layouts-venue-column";

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
  const venueSetting = parseVenueSetting(formData.get("venueSetting"));

  const wRaw = Number(formData.get("canvasWidth"));
  const hRaw = Number(formData.get("canvasHeight"));
  const def = VENUE_DEFAULT_CANVAS[venueSetting];

  const canvasWidth = clampCanvasDimension(
    Number.isFinite(wRaw) ? wRaw : def.width,
    def.width,
  );
  const canvasHeight = clampCanvasDimension(
    Number.isFinite(hRaw) ? hRaw : def.height,
    def.height,
  );

  if (!name) {
    return { error: "Name is required" as const };
  }

  const layoutJson: LayoutJsonDocument = initialLayoutDocumentForVenue(venueSetting, useTemplate);

  const hasVenueColumn = await layoutsTableHasVenueSettingColumn(supabase);
  const insertRow = {
    user_id: user.id,
    name,
    venue_name: venueName || "Garden estate venue",
    location: location || "Philippines",
    ...(hasVenueColumn ? { venue_setting: venueSetting } : {}),
    canvas_width: canvasWidth,
    canvas_height: canvasHeight,
    layout_json: layoutJson,
  };

  const { data, error } = await supabase.from("layouts").insert(insertRow).select("id").single();

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

  const doc = (row.layout_json ?? emptyLayoutDocument()) as LayoutJsonDocument;

  const hasVenueColumn = await layoutsTableHasVenueSettingColumn(supabase);
  const insertRow = {
    user_id: user.id,
    name: `Copy of ${row.name}`,
    venue_name: row.venue_name,
    location: row.location,
    ...(hasVenueColumn
      ? { venue_setting: parseVenueSetting((row as { venue_setting?: string }).venue_setting) }
      : {}),
    canvas_width: row.canvas_width,
    canvas_height: row.canvas_height,
    layout_json: doc,
  };

  const { data, error } = await supabase.from("layouts").insert(insertRow).select("id").single();

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
