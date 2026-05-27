/** Minutes between background saves (only runs when the layout is dirty). Keeps Supabase writes low on free tier. */
export const LAYOUT_AUTO_SAVE_INTERVAL_MINUTES = 10;

/** Interval for background saves while the layout has unsaved changes. */
export const LAYOUT_AUTO_SAVE_INTERVAL_MS =
  LAYOUT_AUTO_SAVE_INTERVAL_MINUTES * 60 * 1000;
