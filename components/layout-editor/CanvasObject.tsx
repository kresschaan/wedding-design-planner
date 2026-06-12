"use client";

import { Lock } from "lucide-react";
import type { CanvasObject as CanvasObjectModel } from "@/types/layout";
import { isTableLikeType } from "@/types/layout";
import { cn } from "@/lib/utils";
import type { ResizeEdge } from "@/lib/canvas-resize";
import { TableChairSlotMarkers } from "./table-chair-slot-markers";

function humanizeType(type: string): string {
  return type
    .replaceAll("_", " ")
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

/** Readable title + optional subtitle, always below the asset (never over icons). */
function ObjectCaption({ obj }: { obj: CanvasObjectModel }) {
  const title = obj.label?.trim() || humanizeType(obj.type);
  let subtitle: string | undefined;
  if (obj.type === "chair") {
    subtitle = obj.meta.guestName?.trim() || undefined;
  } else if (isTableLikeType(obj.type)) {
    subtitle = `Seats ${obj.meta.seatCount ?? "—"}`;
  }
  const maxW = Math.max(obj.width, 120);

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-full z-10 mt-3 flex max-w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 flex-col items-center gap-1.5 px-2 text-center break-words hyphens-auto"
      style={{ maxWidth: maxW }}
    >
      <span
        className={cn(
          "text-base leading-snug font-semibold tracking-tight text-[#0f172a] [text-shadow:0_1px_0_rgba(255,255,255,0.95)]",
          title.split(/\s+/).length <= 2 && title.length <= 22 && "whitespace-nowrap",
        )}
      >
        {title}
      </span>
      {subtitle ? (
        <span className="text-sm leading-snug font-medium text-[#334155]">{subtitle}</span>
      ) : null}
    </div>
  );
}

export type ChairSlotPreview = {
  tableId: string;
  slotIndex: number;
  chairWidth: number;
  chairHeight: number;
};

/** Renders outside the clipped table frame so ring slots (beyond the bbox) stay visible. */
function tableChairSlotOverlay(
  table: CanvasObjectModel,
  slotHighlight: number | null,
  chairSlotPreview: ChairSlotPreview | null,
) {
  return (
    <TableChairSlotMarkers
      table={table}
      highlightIndex={slotHighlight}
      chairWidth={chairSlotPreview?.chairWidth}
      chairHeight={chairSlotPreview?.chairHeight}
    />
  );
}

interface CanvasObjectProps {
  obj: CanvasObjectModel;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  onResizePointerDown?: (e: React.PointerEvent, id: string, edge: ResizeEdge) => void;
  /** While dragging a chair, highlights the nearest free seat slot on this table (if id matches). */
  chairSlotPreview?: ChairSlotPreview | null;
}

const RESIZE_EDGES: { edge: ResizeEdge; className: string; cursor: string }[] = [
  { edge: "nw", className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "cursor-nwse-resize" },
  { edge: "n", className: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2", cursor: "cursor-ns-resize" },
  { edge: "ne", className: "right-0 top-0 translate-x-1/2 -translate-y-1/2", cursor: "cursor-nesw-resize" },
  { edge: "e", className: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2", cursor: "cursor-ew-resize" },
  { edge: "se", className: "right-0 bottom-0 translate-x-1/2 translate-y-1/2", cursor: "cursor-nwse-resize" },
  { edge: "s", className: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2", cursor: "cursor-ns-resize" },
  { edge: "sw", className: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2", cursor: "cursor-nesw-resize" },
  { edge: "w", className: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2", cursor: "cursor-ew-resize" },
];

function ObjectResizeHandles({
  onPointerDown,
}: {
  onPointerDown: (e: React.PointerEvent, edge: ResizeEdge) => void;
}) {
  return (
    <>
      {RESIZE_EDGES.map(({ edge, className, cursor }) => (
        <button
          key={edge}
          type="button"
          tabIndex={-1}
          aria-label={`Resize from ${edge}`}
          className={cn(
            "pointer-events-auto absolute z-30 h-3.5 w-3.5 rounded-sm border-2 border-[#172554] bg-white shadow-md",
            "touch-manipulation hover:bg-amber-50 active:bg-amber-100",
            cursor,
            className,
          )}
          onPointerDown={(e) => onPointerDown(e, edge)}
        />
      ))}
    </>
  );
}

/** Shared “planner toy” look: comic outline, stacked shadow, saturated fills. */
const cartoonFrame = cn(
  "absolute select-none touch-none overflow-hidden",
  "border-[3px] border-[#172554]",
  "shadow-[0_5px_0_rgba(23,37,84,0.12),0_12px_28px_rgba(15,23,42,0.1)]",
);

/** Selection halo — warm champagne, matches login primary (not neon fuchsia). */
const selectedRing = cn(
  "ring-[2.5px] ring-[oklch(0.78_0.055_78)] ring-offset-[4px] ring-offset-[#faf7f0]",
);

function TopDownChair({ accent }: { accent: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className="pointer-events-none h-[78%] w-[78%]"
      aria-hidden
    >
      <ellipse cx="24" cy="17" rx="11" ry="10" fill="#fcd4a4" stroke="#172554" strokeWidth="2" />
      <path
        d="M10 30c0-6 6-10 14-10s14 4 14 10v6H10v-6z"
        fill={accent}
        stroke="#172554"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <ellipse cx="24" cy="15" rx="4" ry="3.5" fill="#1e293b" opacity="0.55" />
    </svg>
  );
}

function MiniTree() {
  return (
    <svg viewBox="0 0 40 48" className="pointer-events-none h-[85%] w-[85%]" aria-hidden>
      <path
        d="M20 6 L32 22 L26 22 L34 34 L6 34 L14 22 L8 22 Z"
        fill="#4ade80"
        stroke="#14532d"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <rect x="17" y="32" width="6" height="12" rx="1" fill="#78350f" stroke="#422006" strokeWidth="1.5" />
    </svg>
  );
}

/** Bouquet-style flower on a stand — reads clearly as florals, not a tree. */
function IconFlowerStand() {
  const petalAngles = [0, 72, 144, 216, 288] as const;
  return (
    <svg viewBox="0 0 40 48" className="pointer-events-none h-[88%] w-[88%]" aria-hidden>
      <path
        d="M11 38 L13.5 46 H26.5 L29 38 Q20 34.5 11 38 Z"
        fill="#92400e"
        stroke="#422006"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M20 37 V20" stroke="#166534" strokeWidth="2.25" strokeLinecap="round" />
      <path
        d="M20 30 Q11 28 9 20"
        fill="none"
        stroke="#15803d"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M20 32 Q29 29 31 21"
        fill="none"
        stroke="#15803d"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <g transform="translate(20 17)">
        {petalAngles.map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-8"
            rx="6"
            ry="5"
            fill="#fbcfe8"
            stroke="#9d174d"
            strokeWidth="1.2"
            transform={`rotate(${deg})`}
          />
        ))}
        <circle cx="0" cy="0" r="4.5" fill="#fef08a" stroke="#854d0e" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

function IconGift() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 32 32" aria-hidden>
      <rect x="4" y="12" width="24" height="16" rx="2" fill="#fda4af" stroke="#172554" strokeWidth="2" />
      <path d="M16 12V6h6a3 3 0 010 6H16zm0 0H10a3 3 0 110 6h6V12z" fill="#fb7185" stroke="#172554" strokeWidth="2" />
      <path d="M16 6v20" stroke="#172554" strokeWidth="2" />
    </svg>
  );
}

function IconCake() {
  return (
    <svg viewBox="0 0 32 32" className="h-[70%] w-[70%]" aria-hidden>
      <rect x="6" y="18" width="20" height="10" rx="2" fill="#fef3c7" stroke="#1e293b" strokeWidth="1.5" />
      <rect x="9" y="12" width="14" height="8" rx="1.5" fill="#fce7f3" stroke="#1e293b" strokeWidth="1.5" />
      <rect x="12" y="6" width="8" height="8" rx="1" fill="#fff7ed" stroke="#1e293b" strokeWidth="1.5" />
      <circle cx="16" cy="5" r="2.5" fill="#f472b6" stroke="#1e293b" strokeWidth="1.2" />
    </svg>
  );
}

function IconSpeaker() {
  return (
    <svg viewBox="0 0 32 32" className="h-[72%] w-[72%]" aria-hidden>
      <rect x="8" y="6" width="16" height="20" rx="3" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
      <circle cx="16" cy="14" r="5" fill="#64748b" stroke="#0f172a" strokeWidth="1.2" />
      <circle cx="16" cy="14" r="2" fill="#cbd5e1" />
      <rect x="12" y="22" width="8" height="2" rx="1" fill="#94a3b8" />
    </svg>
  );
}

function IconScreen() {
  return (
    <svg viewBox="0 0 40 20" className="h-[55%] w-[80%]" aria-hidden>
      <rect x="2" y="3" width="36" height="12" rx="1.5" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1.5" />
      <path d="M20 15v4M14 19h12" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconDoor({ tone }: { tone: "in" | "out" }) {
  const fill = tone === "in" ? "#34d399" : "#fbbf24";
  return (
    <svg viewBox="0 0 36 40" className="h-[70%] w-[60%]" aria-hidden>
      <rect x="6" y="4" width="24" height="32" rx="2" fill={fill} stroke="#1e293b" strokeWidth="1.8" />
      <circle cx="26" cy="22" r="2" fill="#1e293b" />
      <path
        d="M10 10 L10 30"
        stroke="#1e293b"
        strokeWidth="1.2"
        opacity="0.35"
      />
    </svg>
  );
}

function IconSofa() {
  return (
    <svg viewBox="0 0 48 28" className="h-[65%] w-[85%]" aria-hidden>
      <path
        d="M4 18 Q4 10 12 10 L36 10 Q44 10 44 18 L44 22 Q44 24 42 24 L6 24 Q4 24 4 22 Z"
        fill="#a78bfa"
        stroke="#1e293b"
        strokeWidth="1.8"
      />
      <rect x="6" y="8" width="36" height="8" rx="2" fill="#c4b5fd" stroke="#1e293b" strokeWidth="1.5" />
    </svg>
  );
}

function IconBar() {
  return (
    <svg viewBox="0 0 40 32" className="h-[70%] w-[70%]" aria-hidden>
      <rect x="4" y="10" width="32" height="16" rx="2" fill="#fde68a" stroke="#1e293b" strokeWidth="1.5" />
      <rect x="10" y="4" width="6" height="14" rx="1" fill="#38bdf8" stroke="#1e293b" strokeWidth="1.2" />
      <rect x="22" y="4" width="6" height="14" rx="1" fill="#f472b6" stroke="#1e293b" strokeWidth="1.2" />
    </svg>
  );
}

function IconBooth() {
  return (
    <svg viewBox="0 0 36 36" className="h-[75%] w-[75%]" aria-hidden>
      <rect x="6" y="8" width="24" height="22" rx="3" fill="#c4b5fd" stroke="#1e293b" strokeWidth="1.6" />
      <circle cx="18" cy="16" r="5" fill="#e9d5ff" stroke="#1e293b" strokeWidth="1.3" />
      <path d="M10 30h16" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CanvasObjectView({
  obj,
  selected,
  onPointerDown,
  onResizePointerDown,
  chairSlotPreview = null,
}: CanvasObjectProps) {
  const slotHighlight =
    chairSlotPreview && chairSlotPreview.tableId === obj.id ? chairSlotPreview.slotIndex : null;

  const wrap = (
    inner: React.ReactNode,
    aria: string,
    className?: string,
    extraStyle?: React.CSSProperties,
    opts?: {
      useColorFill?: boolean;
      noExternalCaption?: boolean;
      /** Drawn above the frame; use for overlays that extend past `overflow-hidden` (e.g. chair rings). */
      slotOverlay?: React.ReactNode;
    },
  ) => {
    const useFill = opts?.useColorFill !== false;
    const showCaption = !opts?.noExternalCaption;
    const innerFill: React.CSSProperties = {
      ...(useFill ? { backgroundColor: obj.color } : {}),
      ...extraStyle,
    };
    const shell: React.CSSProperties = {
      left: obj.x,
      top: obj.y,
      width: obj.width,
      height: obj.height,
      transform: `rotate(${obj.rotation}deg)`,
      transformOrigin: "center center",
    };
    return (
      <div
        className={cn(
          "absolute touch-none select-none overflow-visible",
          selected && selectedRing,
          obj.meta.locked && "opacity-[0.97]",
        )}
        style={shell}
        title={
          obj.meta.locked
            ? "Position locked — choose Unlock in the Properties panel to move or resize."
            : undefined
        }
        onPointerDown={(e) => onPointerDown(e, obj.id)}
        role="button"
        tabIndex={0}
        aria-label={obj.meta.locked ? `${aria} (locked)` : aria}
      >
        <div className={cn(cartoonFrame, "relative h-full w-full", className)} style={innerFill}>
          {inner}
        </div>
        {opts?.slotOverlay ? (
          <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">{opts.slotOverlay}</div>
        ) : null}
        {obj.meta.locked ? (
          <div
            className="pointer-events-none absolute -right-1 -top-1 z-20 flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-900 bg-gradient-to-b from-amber-100 to-amber-300 text-amber-950 shadow-md ring-2 ring-white/90"
            aria-hidden
          >
            <Lock className="h-4 w-4" strokeWidth={2.4} />
          </div>
        ) : null}
        {showCaption ? <ObjectCaption obj={obj} /> : null}
        {selected && onResizePointerDown && !obj.meta.locked ? (
          <ObjectResizeHandles
            onPointerDown={(e, edge) => {
              e.stopPropagation();
              e.preventDefault();
              onResizePointerDown(e, obj.id, edge);
            }}
          />
        ) : null}
      </div>
    );
  };

  switch (obj.type) {
    case "round_table":
      return wrap(
        <>
          <div
            className="pointer-events-none absolute inset-[8%] rounded-full border-[2.5px] border-[#172554]/15 bg-gradient-to-br from-white/55 to-amber-50/25"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-[22%] rounded-full border-2 border-dashed border-[#172554]/12 bg-white/20"
            aria-hidden
          />
        </>,
        `Round table ${obj.label}`,
        "rounded-full",
        undefined,
        { slotOverlay: tableChairSlotOverlay(obj, slotHighlight, chairSlotPreview) },
      );

    case "sweetheart_table":
      return wrap(
        <>
          <div
            className="pointer-events-none absolute inset-x-[8%] top-[12%] h-[38%] rounded-t-full border-[2.5px] border-rose-900/25 bg-gradient-to-b from-rose-50/80 to-rose-200/35"
            aria-hidden
          />
        </>,
        `Sweetheart table ${obj.label}`,
        "rounded-2xl rounded-t-[48px]",
        undefined,
        { slotOverlay: tableChairSlotOverlay(obj, slotHighlight, chairSlotPreview) },
      );

    case "rectangular_table":
      return wrap(
        <></>,
        `Rectangular table ${obj.label}`,
        "rounded-2xl",
        undefined,
        { slotOverlay: tableChairSlotOverlay(obj, slotHighlight, chairSlotPreview) },
      );

    case "buffet_table":
    case "dessert_table":
    case "registration_table":
    case "gift_table":
    case "bar_area": {
      const deco =
        obj.type === "dessert_table" ? (
          <IconCake />
        ) : obj.type === "gift_table" ? (
          <IconGift />
        ) : obj.type === "bar_area" ? (
          <IconBar />
        ) : null;
      return wrap(
        <>
          {deco ? (
            <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center [&_svg]:h-[58%] [&_svg]:w-[58%]">
              {deco}
            </div>
          ) : null}
        </>,
        `${humanizeType(obj.type)} ${obj.label}`,
        "rounded-2xl",
        undefined,
        { slotOverlay: tableChairSlotOverlay(obj, slotHighlight, chairSlotPreview) },
      );
    }

    case "chair": {
      const guest = obj.meta.guestName?.trim();
      const labelPart = obj.label?.trim() ? `, ${obj.label.trim()}` : "";
      const aria = guest ? `Chair${labelPart}, ${guest}` : `Chair${labelPart}`;
      const hideCaption = !obj.label?.trim() && !guest;
      return wrap(
        <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-b from-[#fffdf8] via-amber-50/95 to-[#f5edd8]">
          <div className="relative z-10 flex h-[82%] w-[82%] items-center justify-center drop-shadow-sm">
            <TopDownChair accent={obj.color} />
          </div>
        </div>,
        aria,
        "rounded-xl",
        { backgroundColor: "#fef9c3" },
        { noExternalCaption: hideCaption },
      );
    }

    case "stage":
      return wrap(
        <>
          <div
            className="pointer-events-none absolute inset-x-3 top-2 h-3 rounded-md bg-white/25 shadow-inner"
            aria-hidden
          />
        </>,
        `Stage ${obj.label}`,
        "rounded-2xl bg-gradient-to-b from-indigo-500 via-slate-700 to-slate-900",
        undefined,
        { useColorFill: false },
      );

    case "dance_floor":
      return wrap(
        <>
          <div
            className="pointer-events-none absolute inset-2 rounded-xl border-2 border-dashed border-violet-400/70 bg-violet-50/30"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #7c3aed, #7c3aed 5px, transparent 5px, transparent 10px)",
            }}
            aria-hidden
          />
        </>,
        `Dance floor ${obj.label}`,
        "rounded-2xl border-dashed border-violet-600/55 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-amber-50",
        { backgroundColor: "#f5f3ff" },
      );

    case "aisle":
      return wrap(
        <div className="flex h-full items-center justify-center">
          <div className="h-[72%] w-1.5 rounded-full bg-stone-400/90 shadow-inner" aria-hidden />
        </div>,
        `Aisle ${obj.label}`,
        "rounded-xl border-dashed border-slate-500/40 bg-stone-100/80",
      );

    case "ceremony_arch":
      return wrap(
        <>
          <svg
            className="pointer-events-none absolute inset-2 text-emerald-900"
            viewBox="0 0 100 44"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M8 40 Q50 4 92 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="50" cy="18" r="6" fill="#f9a8d4" stroke="#14532d" strokeWidth="2" />
          </svg>
        </>,
        `Arch ${obj.label}`,
        "rounded-2xl bg-gradient-to-b from-emerald-200 to-teal-300",
        { backgroundColor: "#a7f3d0" },
      );

    case "text_label":
      return wrap(
        <p
          className="flex h-full min-h-0 w-full items-center justify-center overflow-visible px-2 text-center text-sm leading-snug font-semibold tracking-wide text-balance drop-shadow-sm sm:text-base"
          style={{ color: obj.color }}
        >
          {obj.label}
        </p>,
        `Label ${obj.label}`,
        "overflow-visible rounded-xl border-transparent bg-transparent shadow-none",
        {
          backgroundColor: "transparent",
          boxShadow: "none",
          borderColor: "transparent",
        },
        { useColorFill: false, noExternalCaption: true },
      );

    case "reserved_area":
      return wrap(
        <>
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[repeating-linear-gradient(-45deg,rgba(251,191,36,0.25),rgba(251,191,36,0.25)_10px,transparent_10px,transparent_20px)]" />
        </>,
        `Reserved ${obj.label}`,
        "rounded-2xl border-amber-800/50 bg-amber-50/90",
      );

    case "photo_booth":
      return wrap(
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-violet-200 to-violet-400">
          <IconBooth />
        </div>,
        `Photo booth ${obj.label}`,
        "rounded-2xl",
        undefined,
        { useColorFill: false },
      );

    case "speaker":
      return wrap(
        <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-b from-slate-200 to-slate-400">
          <IconSpeaker />
        </div>,
        `Speaker ${obj.label}`,
        "rounded-2xl",
        undefined,
        { useColorFill: false },
      );

    case "projector_screen":
      return wrap(
        <div className="flex h-full w-full min-w-0 items-center justify-center gap-2 bg-gradient-to-b from-slate-100 to-slate-300 px-2">
          <div className="flex h-[72%] max-h-[26px] w-10 shrink-0 items-center justify-center [&_svg]:h-full [&_svg]:w-full">
            <IconScreen />
          </div>
          <span className="min-w-0 truncate text-[11px] font-semibold leading-tight tracking-wide text-slate-900 sm:text-xs">
            {obj.label?.trim() || "Screen"}
          </span>
        </div>,
        `Screen ${obj.label}`,
        "rounded-lg",
        undefined,
        { useColorFill: false, noExternalCaption: true },
      );

    case "plant_decor":
    case "flower_stand":
      return wrap(
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-sky-50 to-emerald-50">
          {obj.type === "flower_stand" ? (
            <IconFlowerStand />
          ) : (
            <MiniTree />
          )}
        </div>,
        `${obj.type === "flower_stand" ? "Flower stand" : "Plant decor"} ${obj.label}`,
        "rounded-2xl",
        { backgroundColor: "#d9f99d" },
      );

    case "entrance":
      return wrap(
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-emerald-200 to-emerald-400">
          <IconDoor tone="in" />
        </div>,
        `Entrance ${obj.label}`,
        "rounded-2xl",
        undefined,
        { useColorFill: false },
      );

    case "exit":
      return wrap(
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-amber-200 to-amber-400">
          <IconDoor tone="out" />
        </div>,
        `Exit ${obj.label}`,
        "rounded-2xl",
        undefined,
        { useColorFill: false },
      );

    case "lounge_sofa":
      return wrap(
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-violet-100 to-violet-300">
          <IconSofa />
        </div>,
        `Lounge ${obj.label}`,
        "rounded-2xl",
        undefined,
        { useColorFill: false },
      );

    case "church_pew":
      return wrap(
        <div className="relative h-full w-full overflow-hidden rounded-md border-2 border-[#422006] bg-gradient-to-b from-amber-100 via-amber-300 to-amber-700">
          <svg viewBox="0 0 120 20" className="h-full w-full opacity-90" preserveAspectRatio="none" aria-hidden>
            <line x1="6" y1="7" x2="114" y2="7" stroke="#422006" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="6" y1="13" x2="114" y2="13" stroke="#422006" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>,
        `Church pew ${obj.label}`,
        "rounded-md",
      );

    case "outdoor_tent":
      return wrap(
        <div className="relative h-full w-full overflow-hidden rounded-xl border-2 border-amber-900/45 bg-[repeating-linear-gradient(118deg,#fffbeb_0px,#fffbeb_10px,#fde68a_10px,#fde68a_20px)]">
          <div
            className="absolute inset-x-[8%] top-0 h-[26%] bg-amber-50/95"
            style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }}
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[22%] border-t-2 border-amber-900/35" aria-hidden />
        </div>,
        `Tent ${obj.label}`,
        "rounded-xl",
      );

    case "garden_arbor":
      return wrap(
        <div className="relative h-full w-full overflow-hidden rounded-lg border-2 border-green-900/35 bg-gradient-to-b from-lime-50 to-emerald-200">
          <svg viewBox="0 0 100 72" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
            <rect x="10" y="18" width="9" height="52" rx="1" fill="#365314" />
            <rect x="81" y="18" width="9" height="52" rx="1" fill="#365314" />
            <path d="M6 22 Q50 4 94 22" fill="none" stroke="#166534" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M12 24 L88 24" stroke="#15803d" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M18 28 L82 28" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.5" />
          </svg>
        </div>,
        `Garden arbor ${obj.label}`,
        "rounded-lg",
      );

    default:
      return wrap(
        <div className="h-full w-full rounded-[inherit] bg-muted/40" aria-hidden />,
        `${obj.type} ${obj.label}`,
        "rounded-2xl",
      );
  }
}
