"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLayoutEditorStore } from "@/stores/layout-editor-store";
import type { CanvasObjectType } from "@/types/layout";
import { CanvasObjectView } from "./CanvasObject";
import { cn } from "@/lib/utils";
import type { ResizeEdge } from "@/lib/canvas-resize";
import {
  computeResizedRect,
  computeUniformSquareResize,
  isUniformScaleResizeType,
} from "@/lib/canvas-resize";
import { aabbIntersects, getObjectBoundingBox } from "@/lib/canvas-object-bounds";

const LAYOUT_GRID = 20;
const RESIZE_MIN = 16;
/** Canvas px — below this, treat as click not a selection box. */
const MARQUEE_MIN_SIZE = 4;

function clientToCanvas(
  el: HTMLDivElement,
  clientX: number,
  clientY: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const r = el.getBoundingClientRect();
  const x = ((clientX - r.left) / r.width) * canvasWidth;
  const y = ((clientY - r.top) / r.height) * canvasHeight;
  return { x, y };
}

function snapScalar(v: number, snapToGrid: boolean): number {
  if (!snapToGrid) return Math.round(v);
  return Math.round(v / LAYOUT_GRID) * LAYOUT_GRID;
}

type ResizeSession = {
  id: string;
  edge: ResizeEdge;
  orig: { x: number; y: number; w: number; h: number };
  startPointerCanvasX: number;
  startPointerCanvasY: number;
};

type DragSession = {
  ids: string[];
  primaryId: string;
  starts: Record<string, { x: number; y: number }>;
  offsetX: number;
  offsetY: number;
};

type MarqueeSession = {
  pointerId: number;
  sx: number;
  sy: number;
  cx: number;
  cy: number;
  additive: boolean;
};

export function CanvasWorkspace() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragSession | null>(null);
  const resizeSessionRef = useRef<ResizeSession | null>(null);
  const marqueeSessionRef = useRef<MarqueeSession | null>(null);
  const marqueeListenersRef = useRef<{ move: (e: PointerEvent) => void; up: (e: PointerEvent) => void } | null>(
    null,
  );

  const [marqueeUI, setMarqueeUI] = useState<MarqueeSession | null>(null);

  const objects = useLayoutEditorStore((s) => s.document.objects);
  const selectedIds = useLayoutEditorStore((s) => s.selectedIds);
  const beginPointerGesture = useLayoutEditorStore((s) => s.beginPointerGesture);
  const setManyObjectPositions = useLayoutEditorStore((s) => s.setManyObjectPositions);
  const addObjectFromType = useLayoutEditorStore((s) => s.addObjectFromType);
  const canvasWidth = useLayoutEditorStore((s) => s.canvasWidth);
  const canvasHeight = useLayoutEditorStore((s) => s.canvasHeight);
  const showGrid = useLayoutEditorStore((s) => s.showGrid);
  const zoom = useLayoutEditorStore((s) => s.zoom);

  const selectedSet = new Set(selectedIds);

  useEffect(() => {
    return () => {
      const L = marqueeListenersRef.current;
      if (L) {
        window.removeEventListener("pointermove", L.move);
        window.removeEventListener("pointerup", L.up);
        window.removeEventListener("pointercancel", L.up);
        marqueeListenersRef.current = null;
      }
      marqueeSessionRef.current = null;
    };
  }, []);

  const teardownMarqueeListeners = useCallback(() => {
    const L = marqueeListenersRef.current;
    if (L) {
      window.removeEventListener("pointermove", L.move);
      window.removeEventListener("pointerup", L.up);
      window.removeEventListener("pointercancel", L.up);
      marqueeListenersRef.current = null;
    }
    marqueeSessionRef.current = null;
    setMarqueeUI(null);
  }, []);

  const finalizeMarquee = useCallback(() => {
    const session = marqueeSessionRef.current;
    if (!session) {
      teardownMarqueeListeners();
      return;
    }
    const minX = Math.min(session.sx, session.cx);
    const maxX = Math.max(session.sx, session.cx);
    const minY = Math.min(session.sy, session.cy);
    const maxY = Math.max(session.sy, session.cy);
    const w = maxX - minX;
    const h = maxY - minY;

    const st = useLayoutEditorStore.getState();

    if (w < MARQUEE_MIN_SIZE && h < MARQUEE_MIN_SIZE) {
      if (!session.additive) st.clearSelection();
      teardownMarqueeListeners();
      return;
    }

    const box = { minX, minY, maxX, maxY };
    const hitIds = st.document.objects
      .filter((o) => aabbIntersects(getObjectBoundingBox(o), box))
      .map((o) => o.id);

    if (hitIds.length === 0) {
      if (!session.additive) {
        st.pushUndoSnapshot();
        st.setSelectedIds([]);
      }
      teardownMarqueeListeners();
      return;
    }

    st.pushUndoSnapshot();
    if (session.additive) {
      const merged: string[] = [...st.selectedIds];
      for (const id of hitIds) {
        if (!merged.includes(id)) merged.push(id);
      }
      st.setSelectedIds(merged);
    } else {
      st.setSelectedIds(hitIds);
    }
    teardownMarqueeListeners();
  }, [teardownMarqueeListeners]);

  const onPointerDownObject = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      const additive = e.metaKey || e.ctrlKey;
      const st0 = useLayoutEditorStore.getState();
      st0.pushUndoSnapshot();
      st0.pickObject(id, additive);
      beginPointerGesture();
      const st = useLayoutEditorStore.getState();
      const ids = st.selectedIds;
      const starts: Record<string, { x: number; y: number }> = {};
      for (const oid of ids) {
        const o = st.document.objects.find((x) => x.id === oid);
        if (o) starts[oid] = { x: o.x, y: o.y };
      }
      const o = st.document.objects.find((x) => x.id === id);
      const el = canvasRef.current;
      if (!o || !el) return;
      const { x, y } = clientToCanvas(el, e.clientX, e.clientY, canvasWidth, canvasHeight);
      dragRef.current = {
        ids,
        primaryId: id,
        starts,
        offsetX: x - o.x,
        offsetY: y - o.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [beginPointerGesture, canvasHeight, canvasWidth],
  );

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent, id: string, edge: ResizeEdge) => {
      if (e.button !== 0) return;
      const el = canvasRef.current;
      if (!el) return;
      const st = useLayoutEditorStore.getState();
      const o = st.document.objects.find((x) => x.id === id);
      if (!o) return;
      st.pushUndoSnapshot();
      st.beginPointerGesture();
      const { x, y } = clientToCanvas(el, e.clientX, e.clientY, st.canvasWidth, st.canvasHeight);
      resizeSessionRef.current = {
        id,
        edge,
        orig: { x: o.x, y: o.y, w: o.width, h: o.height },
        startPointerCanvasX: x,
        startPointerCanvasY: y,
      };

      const move = (ev: PointerEvent) => {
        const session = resizeSessionRef.current;
        const canvasEl = canvasRef.current;
        if (!session || !canvasEl) return;
        const cur = useLayoutEditorStore.getState();
        const pos = clientToCanvas(
          canvasEl,
          ev.clientX,
          ev.clientY,
          cur.canvasWidth,
          cur.canvasHeight,
        );
        const dcx = pos.x - session.startPointerCanvasX;
        const dcy = pos.y - session.startPointerCanvasY;
        const obj = cur.document.objects.find((x) => x.id === session.id);
        if (!obj) return;
        const snap = cur.snapToGrid;

        if (isUniformScaleResizeType(obj.type)) {
          const raw = computeUniformSquareResize(
            session.edge,
            session.orig,
            dcx,
            dcy,
            RESIZE_MIN,
          );
          const s = Math.max(RESIZE_MIN, snapScalar(raw.w, snap));
          const cx = session.orig.x + session.orig.w / 2;
          const cy = session.orig.y + session.orig.h / 2;
          const px = snapScalar(cx - s / 2, snap);
          const py = snapScalar(cy - s / 2, snap);
          cur.updateObject(session.id, { x: px, y: py, width: s, height: s });
          return;
        }

        const next = computeResizedRect(
          session.edge,
          session.orig,
          dcx,
          dcy,
          RESIZE_MIN,
          RESIZE_MIN,
        );
        cur.updateObject(session.id, {
          x: snapScalar(next.x, snap),
          y: snapScalar(next.y, snap),
          width: Math.max(RESIZE_MIN, snapScalar(next.w, snap)),
          height: Math.max(RESIZE_MIN, snapScalar(next.h, snap)),
        });
      };

      const up = () => {
        resizeSessionRef.current = null;
        useLayoutEditorStore.getState().endPointerGesture();
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (resizeSessionRef.current) return;
      const drag = dragRef.current;
      const el = canvasRef.current;
      if (!drag || !el) return;
      const st = useLayoutEditorStore.getState();
      const { x, y } = clientToCanvas(el, e.clientX, e.clientY, st.canvasWidth, st.canvasHeight);
      const primary = drag.starts[drag.primaryId];
      if (!primary) return;
      const nx = Math.max(0, x - drag.offsetX);
      const ny = Math.max(0, y - drag.offsetY);
      const dx = nx - primary.x;
      const dy = ny - primary.y;
      const updates = drag.ids.map((oid) => {
        const s0 = drag.starts[oid];
        return {
          id: oid,
          x: Math.max(0, s0.x + dx),
          y: Math.max(0, s0.y + dy),
        };
      });
      setManyObjectPositions(updates);
    },
    [setManyObjectPositions],
  );

  const endDrag = useCallback(() => {
    if (dragRef.current) {
      useLayoutEditorStore.getState().endPointerGesture();
    }
    dragRef.current = null;
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/x-wdp-type") as CanvasObjectType;
    if (!type) return;
    const el = canvasRef.current;
    if (!el) return;
    const st = useLayoutEditorStore.getState();
    const { x, y } = clientToCanvas(el, e.clientX, e.clientY, st.canvasWidth, st.canvasHeight);
    addObjectFromType(type, { x, y });
  };

  const onCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      if (e.target !== e.currentTarget) return;
      const el = canvasRef.current;
      if (!el) return;

      if (marqueeListenersRef.current) {
        teardownMarqueeListeners();
      }

      const st = useLayoutEditorStore.getState();
      const { x, y } = clientToCanvas(el, e.clientX, e.clientY, st.canvasWidth, st.canvasHeight);
      const session: MarqueeSession = {
        pointerId: e.pointerId,
        sx: x,
        sy: y,
        cx: x,
        cy: y,
        additive: e.shiftKey,
      };
      marqueeSessionRef.current = session;
      setMarqueeUI(session);

      const move = (ev: PointerEvent) => {
        if (ev.pointerId !== session.pointerId) return;
        const canvasEl = canvasRef.current;
        if (!canvasEl || !marqueeSessionRef.current) return;
        const cur = useLayoutEditorStore.getState();
        const pos = clientToCanvas(
          canvasEl,
          ev.clientX,
          ev.clientY,
          cur.canvasWidth,
          cur.canvasHeight,
        );
        const s = marqueeSessionRef.current;
        s.cx = pos.x;
        s.cy = pos.y;
        setMarqueeUI({ ...s });
      };

      const up = (ev: PointerEvent) => {
        if (ev.pointerId !== session.pointerId) return;
        finalizeMarquee();
      };

      marqueeListenersRef.current = { move, up };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    },
    [finalizeMarquee, teardownMarqueeListeners],
  );

  return (
    <div
      className="relative min-h-0 flex-1 overflow-auto rounded-xl border border-border/80 bg-muted/30 p-4"
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className="relative inline-block"
        style={{
          width: canvasWidth * zoom,
          height: canvasHeight * zoom,
        }}
      >
        <div
          ref={canvasRef}
          className={cn(
            "relative rounded-lg border border-dashed border-border bg-[#faf7f0] shadow-inner",
            showGrid &&
              "bg-[length:20px_20px] bg-[linear-gradient(to_right,rgba(0,0,0,.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,.04)_1px,transparent_1px)]",
          )}
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
          onPointerDown={onCanvasPointerDown}
          onDragOver={onDragOver}
          onDrop={onDrop}
          role="application"
          aria-label="Venue layout canvas"
        >
          {objects.map((o) => (
            <CanvasObjectView
              key={o.id}
              obj={o}
              selected={selectedSet.has(o.id)}
              onPointerDown={onPointerDownObject}
              onResizePointerDown={onResizePointerDown}
            />
          ))}
          {marqueeUI ? (
            <div
              className="pointer-events-none absolute inset-0 z-[5]"
              aria-hidden
            >
              <div
                className="absolute border-2 border-dashed border-[oklch(0.52_0.14_264)] bg-[oklch(0.62_0.1_264/0.18)] shadow-sm"
                style={{
                  left: Math.min(marqueeUI.sx, marqueeUI.cx),
                  top: Math.min(marqueeUI.sy, marqueeUI.cy),
                  width: Math.abs(marqueeUI.cx - marqueeUI.sx),
                  height: Math.abs(marqueeUI.cy - marqueeUI.sy),
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
