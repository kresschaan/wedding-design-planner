const STORAGE_KEY = "wdp.layoutEditor.panels.v1";
const CHANGE_EVENT = "wdp:layout-editor-panels";

export type LayoutEditorPanelPrefs = {
  leftOpen: boolean;
  rightOpen: boolean;
};

export const DEFAULT_LAYOUT_EDITOR_PANEL_PREFS: LayoutEditorPanelPrefs = {
  leftOpen: false,
  rightOpen: false,
};

let snapshotCache: LayoutEditorPanelPrefs = DEFAULT_LAYOUT_EDITOR_PANEL_PREFS;
/** False until client mount so SSR + first paint match (avoid hydration mismatch). */
let clientPrefsHydrated = false;

export function markLayoutEditorPanelPrefsHydrated(): void {
  if (typeof window === "undefined" || clientPrefsHydrated) return;
  clientPrefsHydrated = true;
  snapshotCache = readFromStorage();
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function parseStored(raw: string | null): LayoutEditorPanelPrefs {
  if (!raw) return DEFAULT_LAYOUT_EDITOR_PANEL_PREFS;
  try {
    const j = JSON.parse(raw) as Partial<LayoutEditorPanelPrefs>;
    return {
      leftOpen:
        typeof j.leftOpen === "boolean"
          ? j.leftOpen
          : DEFAULT_LAYOUT_EDITOR_PANEL_PREFS.leftOpen,
      rightOpen:
        typeof j.rightOpen === "boolean"
          ? j.rightOpen
          : DEFAULT_LAYOUT_EDITOR_PANEL_PREFS.rightOpen,
    };
  } catch {
    return DEFAULT_LAYOUT_EDITOR_PANEL_PREFS;
  }
}

function readFromStorage(): LayoutEditorPanelPrefs {
  if (typeof window === "undefined") return DEFAULT_LAYOUT_EDITOR_PANEL_PREFS;
  return parseStored(window.localStorage.getItem(STORAGE_KEY));
}

/** Stable reference when values are unchanged (for useSyncExternalStore). */
export function getLayoutEditorPanelPrefsSnapshot(): LayoutEditorPanelPrefs {
  if (typeof window === "undefined" || !clientPrefsHydrated) {
    return DEFAULT_LAYOUT_EDITOR_PANEL_PREFS;
  }
  const next = readFromStorage();
  if (
    snapshotCache.leftOpen === next.leftOpen &&
    snapshotCache.rightOpen === next.rightOpen
  ) {
    return snapshotCache;
  }
  snapshotCache = next;
  return snapshotCache;
}

export function getLayoutEditorPanelPrefsServerSnapshot(): LayoutEditorPanelPrefs {
  return DEFAULT_LAYOUT_EDITOR_PANEL_PREFS;
}

export function subscribeLayoutEditorPanelPrefs(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const on = () => onStoreChange();
  window.addEventListener(CHANGE_EVENT, on);
  window.addEventListener("storage", on);
  return () => {
    window.removeEventListener(CHANGE_EVENT, on);
    window.removeEventListener("storage", on);
  };
}

export function patchLayoutEditorPanelPrefs(patch: Partial<LayoutEditorPanelPrefs>): void {
  if (typeof window === "undefined") return;
  if (!clientPrefsHydrated) {
    markLayoutEditorPanelPrefsHydrated();
  }
  const cur = readFromStorage();
  const next: LayoutEditorPanelPrefs = {
    leftOpen: patch.leftOpen ?? cur.leftOpen,
    rightOpen: patch.rightOpen ?? cur.rightOpen,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
  snapshotCache = next;
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}
