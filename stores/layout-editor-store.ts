"use client";

import { create } from "zustand";
import type {
  CanvasObject,
  CanvasObjectType,
  LayoutJsonDocument,
  LayoutRow,
} from "@/types/layout";
import {
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
  defaultObjectForType,
  emptyLayoutDocument,
} from "@/lib/sample-layout";
import { parseLayoutJson } from "@/lib/layout-json";
import { reconcileCanvasWithObjects } from "@/lib/canvas-auto-expand";
import { parseLayoutClipboard, serializeLayoutClipboard } from "@/lib/layout-clipboard";

const GRID = 20;
const MAX_UNDO = 50;

function snap(value: number, enabled: boolean): number {
  if (!enabled) return Math.round(value);
  return Math.round(value / GRID) * GRID;
}

function cloneDoc(doc: LayoutJsonDocument): LayoutJsonDocument {
  return structuredClone(doc);
}

export type UndoFrame = {
  document: LayoutJsonDocument;
  canvasWidth: number;
  canvasHeight: number;
  selectedIds: string[];
};

/** During drag/resize we push one snapshot at gesture start; skip pushes while > 0. */
let pointerGestureDepth = 0;

function filterSelectionToExisting(selectedIds: string[], objects: CanvasObject[]): string[] {
  const ids = new Set(objects.map((o) => o.id));
  return selectedIds.filter((id) => ids.has(id));
}

export interface LayoutEditorState {
  layoutId: string;
  name: string;
  venueName: string;
  location: string;
  canvasWidth: number;
  canvasHeight: number;
  document: LayoutJsonDocument;
  selectedIds: string[];
  undoStack: UndoFrame[];
  redoStack: UndoFrame[];
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  dirty: boolean;
  isSaving: boolean;
  lastError: string | null;
  lastSavedAt: string | null;

  hydrateFromRow: (row: LayoutRow) => void;
  resetEmpty: (id: string) => void;
  setMeta: (
    patch: Partial<{ name: string; venueName: string; location: string }>,
  ) => void;
  setCanvasSize: (w: number, h: number) => void;
  /** Replace selection with these ids (dedupe, preserve order). */
  setSelectedIds: (ids: string[]) => void;
  /** Toggle id in selection (meta/ctrl-click). */
  toggleSelect: (id: string) => void;
  /**
   * Normal click: select only this object, unless it is already in the current
   * selection — then keep the multi-selection (for dragging the group).
   */
  pickObject: (id: string, additive: boolean) => void;
  clearSelection: () => void;
  beginPointerGesture: () => void;
  endPointerGesture: () => void;
  pushUndoSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  copySelection: () => void;
  pasteClipboard: () => Promise<void>;
  addObjectFromType: (type: CanvasObjectType, at?: { x: number; y: number }) => void;
  updateObject: (id: string, patch: Partial<CanvasObject>) => void;
  deleteObjects: (ids: string[]) => void;
  deleteSelection: () => void;
  duplicateSelection: () => void;
  setObjectPosition: (id: string, x: number, y: number) => void;
  setManyObjectPositions: (updates: { id: string; x: number; y: number }[]) => void;
  reconcileCanvas: () => void;
  setZoom: (z: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  markSaved: (updatedAt: string) => void;
  markDirty: () => void;
  setSaving: (v: boolean) => void;
  setError: (msg: string | null) => void;
  loadDocument: (doc: LayoutJsonDocument) => void;
}

function clampCanvasDimension(n: number): number {
  return Math.min(5600, Math.max(400, Math.round(n)));
}

export const useLayoutEditorStore = create<LayoutEditorState>((set, get) => ({
  layoutId: "",
  name: "Untitled layout",
  venueName: "Garden estate venue",
  location: "Philippines",
  canvasWidth: DEFAULT_CANVAS_WIDTH,
  canvasHeight: DEFAULT_CANVAS_HEIGHT,
  document: emptyLayoutDocument(),
  selectedIds: [],
  undoStack: [],
  redoStack: [],
  zoom: 1,
  showGrid: true,
  snapToGrid: true,
  dirty: false,
  isSaving: false,
  lastError: null,
  lastSavedAt: null,

  hydrateFromRow: (row) => {
    const doc = parseLayoutJson(row.layout_json);
    set({
      layoutId: row.id,
      name: row.name,
      venueName: row.venue_name,
      location: row.location,
      canvasWidth: row.canvas_width,
      canvasHeight: row.canvas_height,
      document: doc,
      selectedIds: [],
      undoStack: [],
      redoStack: [],
      dirty: false,
      lastSavedAt: row.updated_at,
      lastError: null,
    });
    queueMicrotask(() => {
      get().reconcileCanvas();
    });
  },

  resetEmpty: (id) => {
    set({
      layoutId: id,
      name: "Untitled layout",
      venueName: "Garden estate venue",
      location: "Philippines",
      canvasWidth: DEFAULT_CANVAS_WIDTH,
      canvasHeight: DEFAULT_CANVAS_HEIGHT,
      document: emptyLayoutDocument(),
      selectedIds: [],
      undoStack: [],
      redoStack: [],
      dirty: true,
      lastSavedAt: null,
      lastError: null,
    });
  },

  setMeta: (patch) => {
    set((s) => ({
      ...s,
      ...patch,
      dirty: true,
    }));
  },

  setCanvasSize: (w, h) => {
    if (pointerGestureDepth === 0) get().pushUndoSnapshot();
    set({
      canvasWidth: clampCanvasDimension(w),
      canvasHeight: clampCanvasDimension(h),
      dirty: true,
    });
  },

  setSelectedIds: (ids) => {
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const id of ids) {
      if (!seen.has(id)) {
        seen.add(id);
        deduped.push(id);
      }
    }
    set({ selectedIds: deduped });
  },

  toggleSelect: (id) => {
    set((s) => {
      const i = s.selectedIds.indexOf(id);
      if (i >= 0) {
        return { selectedIds: s.selectedIds.filter((x) => x !== id) };
      }
      return { selectedIds: [...s.selectedIds, id] };
    });
  },

  pickObject: (id, additive) => {
    if (additive) {
      get().toggleSelect(id);
      return;
    }
    set((s) => {
      if (s.selectedIds.includes(id)) {
        return {};
      }
      return { selectedIds: [id] };
    });
  },

  clearSelection: () => set({ selectedIds: [] }),

  beginPointerGesture: () => {
    pointerGestureDepth++;
  },

  endPointerGesture: () => {
    pointerGestureDepth = Math.max(0, pointerGestureDepth - 1);
  },

  pushUndoSnapshot: () => {
    const s = get();
    const frame: UndoFrame = {
      document: cloneDoc(s.document),
      canvasWidth: s.canvasWidth,
      canvasHeight: s.canvasHeight,
      selectedIds: [...s.selectedIds],
    };
    set((st) => ({
      undoStack: [...st.undoStack, frame].slice(-MAX_UNDO),
      redoStack: [],
    }));
  },

  undo: () => {
    const s = get();
    if (s.undoStack.length === 0) return;
    const prev = s.undoStack[s.undoStack.length - 1];
    const current: UndoFrame = {
      document: cloneDoc(s.document),
      canvasWidth: s.canvasWidth,
      canvasHeight: s.canvasHeight,
      selectedIds: [...s.selectedIds],
    };
    set({
      document: cloneDoc(prev.document),
      canvasWidth: prev.canvasWidth,
      canvasHeight: prev.canvasHeight,
      selectedIds: filterSelectionToExisting(prev.selectedIds, prev.document.objects),
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, current],
      dirty: true,
    });
    get().reconcileCanvas();
  },

  redo: () => {
    const s = get();
    if (s.redoStack.length === 0) return;
    const next = s.redoStack[s.redoStack.length - 1];
    const current: UndoFrame = {
      document: cloneDoc(s.document),
      canvasWidth: s.canvasWidth,
      canvasHeight: s.canvasHeight,
      selectedIds: [...s.selectedIds],
    };
    set({
      document: cloneDoc(next.document),
      canvasWidth: next.canvasWidth,
      canvasHeight: next.canvasHeight,
      selectedIds: filterSelectionToExisting(next.selectedIds, next.document.objects),
      undoStack: [...s.undoStack, current].slice(-MAX_UNDO),
      redoStack: s.redoStack.slice(0, -1),
      dirty: true,
    });
    get().reconcileCanvas();
  },

  copySelection: () => {
    const s = get();
    const idSet = new Set(s.selectedIds);
    const ordered = s.document.objects.filter((o) => idSet.has(o.id));
    if (ordered.length === 0) return;
    const text = serializeLayoutClipboard(ordered);
    void navigator.clipboard.writeText(text).catch(() => {});
  },

  pasteClipboard: async () => {
    let text = "";
    try {
      text = await navigator.clipboard.readText();
    } catch {
      return;
    }
    const objects = parseLayoutClipboard(text);
    if (!objects || objects.length === 0) return;
    get().pushUndoSnapshot();
    const { snapToGrid } = get();
    const offset = 32;
    const additions: CanvasObject[] = [];
    const newIds: string[] = [];
    for (const o of objects) {
      const nid = crypto.randomUUID();
      newIds.push(nid);
      additions.push({
        ...o,
        id: nid,
        x: snap((o.x ?? 0) + offset, snapToGrid),
        y: snap((o.y ?? 0) + offset, snapToGrid),
      });
    }
    set((st) => ({
      document: { version: 1, objects: [...st.document.objects, ...additions] },
      selectedIds: newIds,
      dirty: true,
    }));
    get().reconcileCanvas();
  },

  addObjectFromType: (type, at) => {
    get().pushUndoSnapshot();
    const base = defaultObjectForType(type);
    const id = crypto.randomUUID();
    const { snapToGrid, canvasWidth, canvasHeight } = get();
    const x = snap(
      at?.x ?? 80 + Math.random() * (canvasWidth * 0.3),
      snapToGrid,
    );
    const y = snap(
      at?.y ?? 80 + Math.random() * (canvasHeight * 0.3),
      snapToGrid,
    );
    const next: CanvasObject = {
      id,
      ...base,
      x,
      y,
    };
    set((s) => ({
      document: { version: 1, objects: [...s.document.objects, next] },
      selectedIds: [id],
      dirty: true,
    }));
    get().reconcileCanvas();
  },

  updateObject: (id, patch) => {
    if (pointerGestureDepth === 0) get().pushUndoSnapshot();
    set((s) => ({
      document: {
        version: 1,
        objects: s.document.objects.map((o) =>
          o.id === id
            ? {
                ...o,
                ...patch,
                meta: { ...o.meta, ...(patch.meta ?? {}) },
              }
            : o,
        ),
      },
      dirty: true,
    }));
    const geom = (["x", "y", "width", "height", "rotation"] as const).some((k) => k in patch);
    if (geom) get().reconcileCanvas();
  },

  deleteObjects: (ids) => {
    if (ids.length === 0) return;
    get().pushUndoSnapshot();
    const idSet = new Set(ids);
    set((s) => ({
      document: {
        version: 1,
        objects: s.document.objects.filter((o) => !idSet.has(o.id)),
      },
      selectedIds: s.selectedIds.filter((id) => !idSet.has(id)),
      dirty: true,
    }));
  },

  deleteSelection: () => {
    const ids = get().selectedIds;
    if (ids.length === 0) return;
    get().deleteObjects(ids);
  },

  duplicateSelection: () => {
    const s = get();
    const idSet = new Set(s.selectedIds);
    const toCopy = s.document.objects.filter((o) => idSet.has(o.id));
    if (toCopy.length === 0) return;
    get().pushUndoSnapshot();
    const stagger = 24;
    const additions: CanvasObject[] = [];
    const newIds: string[] = [];
    let i = 0;
    for (const o of toCopy) {
      const nid = crypto.randomUUID();
      newIds.push(nid);
      additions.push({
        ...o,
        id: nid,
        x: o.x + stagger * (i + 1),
        y: o.y + stagger * (i + 1),
        label: o.label ? `${o.label} (copy)` : o.label,
      });
      i++;
    }
    set((st) => ({
      document: { version: 1, objects: [...st.document.objects, ...additions] },
      selectedIds: newIds,
      dirty: true,
    }));
    get().reconcileCanvas();
  },

  setObjectPosition: (id, x, y) => {
    const { snapToGrid } = get();
    set((s) => ({
      document: {
        version: 1,
        objects: s.document.objects.map((o) =>
          o.id === id ? { ...o, x: snap(x, snapToGrid), y: snap(y, snapToGrid) } : o,
        ),
      },
      dirty: true,
    }));
    get().reconcileCanvas();
  },

  setManyObjectPositions: (updates) => {
    if (updates.length === 0) return;
    const { snapToGrid } = get();
    const map = new Map(updates.map((u) => [u.id, u] as const));
    set((s) => ({
      document: {
        version: 1,
        objects: s.document.objects.map((o) => {
          const u = map.get(o.id);
          if (!u) return o;
          return { ...o, x: snap(u.x, snapToGrid), y: snap(u.y, snapToGrid) };
        }),
      },
      dirty: true,
    }));
    get().reconcileCanvas();
  },

  reconcileCanvas: () => {
    const s = get();
    const out = reconcileCanvasWithObjects(
      s.canvasWidth,
      s.canvasHeight,
      s.document.objects,
      s.snapToGrid,
    );
    if (!out) return;
    set({
      canvasWidth: clampCanvasDimension(out.canvasWidth),
      canvasHeight: clampCanvasDimension(out.canvasHeight),
      document: { version: 1, objects: out.objects },
      dirty: true,
    });
  },

  setZoom: (z) => set({ zoom: Math.min(1.6, Math.max(0.45, Math.round(z * 10) / 10)) }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),

  markSaved: (updatedAt) =>
    set({ dirty: false, lastSavedAt: updatedAt, lastError: null }),
  markDirty: () => set({ dirty: true }),
  setSaving: (v) => set({ isSaving: v }),
  setError: (msg) => set({ lastError: msg }),

  loadDocument: (doc) => {
    get().pushUndoSnapshot();
    set({
      document: parseLayoutJson(doc),
      selectedIds: [],
      dirty: true,
    });
    get().reconcileCanvas();
  },
}));
