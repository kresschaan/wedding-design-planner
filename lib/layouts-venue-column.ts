import type { SupabaseClient } from "@supabase/supabase-js";

let cachedHasVenueSetting: boolean | null = null;

/** For tests or after applying migrations in the same process. */
export function resetLayoutsVenueSettingColumnCache(): void {
  cachedHasVenueSetting = null;
}

/**
 * Whether `public.layouts.venue_setting` exists (migration applied).
 * Cached per server runtime so we only probe once.
 */
export async function layoutsTableHasVenueSettingColumn(
  supabase: SupabaseClient,
): Promise<boolean> {
  if (cachedHasVenueSetting !== null) {
    return cachedHasVenueSetting;
  }
  const { error } = await supabase.from("layouts").select("venue_setting").limit(1);
  const msg = error?.message ?? "";
  if (error && msg.includes("venue_setting")) {
    cachedHasVenueSetting = false;
    return false;
  }
  if (error) {
    // RLS, empty project, etc. — assume column exists so normal errors surface elsewhere.
    cachedHasVenueSetting = true;
    return true;
  }
  cachedHasVenueSetting = true;
  return true;
}
