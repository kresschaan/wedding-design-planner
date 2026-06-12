import type { CanvasObjectType } from "@/types/layout";
import { cn } from "@/lib/utils";

const frame =
  "flex size-11 shrink-0 items-center justify-center overflow-hidden border-[2.5px] border-[#1e293b] shadow-[0_3px_0_rgba(30,41,59,0.18)]";

/**
 * Small “toy planner” preview for the sidebar — matches the canvas cartoon language (thick outline, pastels).
 */
export function PaletteMiniThumb({ type }: { type: CanvasObjectType }) {
  switch (type) {
    case "round_table":
      return (
        <div className={cn(frame, "rounded-full bg-gradient-to-br from-amber-100 to-orange-200")} aria-hidden>
          <div className="size-7 rounded-full border-2 border-[#1e293b]/20 bg-white/50" />
        </div>
      );
    case "rectangular_table":
    case "buffet_table":
    case "registration_table":
      return (
        <div className={cn(frame, "rounded-xl bg-gradient-to-br from-orange-100 to-amber-200")} aria-hidden>
          <div className="h-5 w-8 rounded-md border-2 border-[#1e293b]/25 bg-white/45" />
        </div>
      );
    case "chair":
      return (
        <div className={cn(frame, "rounded-xl bg-gradient-to-b from-amber-50 to-amber-200")} aria-hidden>
          <svg viewBox="0 0 32 32" className="size-8">
            <ellipse cx="16" cy="11" rx="7" ry="6.5" fill="#fcd4a4" stroke="#1e293b" strokeWidth="1.6" />
            <path
              d="M7 22c0-4 4-7 9-7s9 3 9 7v4H7v-4z"
              fill="#b8976a"
              stroke="#1e293b"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    case "sweetheart_table":
      return (
        <div className={cn(frame, "rounded-2xl rounded-t-[20px] bg-gradient-to-b from-rose-100 to-rose-300")} aria-hidden>
          <div className="h-3 w-7 rounded-t-full border-2 border-rose-900/20 bg-white/40" />
        </div>
      );
    case "stage":
      return (
        <div className={cn(frame, "rounded-xl bg-gradient-to-b from-slate-500 to-slate-800")} aria-hidden>
          <div className="h-2 w-7 rounded bg-white/30" />
        </div>
      );
    case "dance_floor":
      return (
        <div
          className={cn(frame, "rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100")}
          aria-hidden
        >
          <div className="size-7 rounded-lg border-2 border-dashed border-violet-500/60 bg-violet-200/40" />
        </div>
      );
    case "entrance":
      return (
        <div className={cn(frame, "rounded-xl bg-gradient-to-b from-emerald-300 to-emerald-500")} aria-hidden>
          <svg viewBox="0 0 24 28" className="size-7">
            <rect x="5" y="3" width="14" height="22" rx="1.5" fill="#34d399" stroke="#1e293b" strokeWidth="1.4" />
            <circle cx="16" cy="14" r="1.5" fill="#1e293b" />
          </svg>
        </div>
      );
    case "exit":
      return (
        <div className={cn(frame, "rounded-xl bg-gradient-to-b from-amber-300 to-amber-500")} aria-hidden>
          <svg viewBox="0 0 24 28" className="size-7">
            <rect x="5" y="3" width="14" height="22" rx="1.5" fill="#fbbf24" stroke="#1e293b" strokeWidth="1.4" />
            <circle cx="16" cy="14" r="1.5" fill="#1e293b" />
          </svg>
        </div>
      );
    case "dessert_table":
      return (
        <div className={cn(frame, "rounded-xl bg-gradient-to-br from-pink-50 to-amber-100")} aria-hidden>
          <svg viewBox="0 0 28 28" className="size-8">
            <rect x="5" y="14" width="18" height="9" rx="1.5" fill="#fef3c7" stroke="#1e293b" strokeWidth="1.3" />
            <rect x="8" y="9" width="12" height="7" rx="1" fill="#fce7f3" stroke="#1e293b" strokeWidth="1.2" />
            <circle cx="14" cy="6" r="2" fill="#fb7185" stroke="#1e293b" strokeWidth="1" />
          </svg>
        </div>
      );
    case "gift_table":
      return (
        <div className={cn(frame, "rounded-xl bg-gradient-to-br from-rose-50 to-rose-200")} aria-hidden>
          <svg viewBox="0 0 28 28" className="size-8">
            <rect x="4" y="12" width="20" height="12" rx="1.5" fill="#fda4af" stroke="#1e293b" strokeWidth="1.2" />
            <path
              d="M14 12V7h4a2 2 0 010 4h-4zm0 0h-4a2 2 0 100 4h4V12z"
              fill="#fb7185"
              stroke="#1e293b"
              strokeWidth="1.2"
            />
          </svg>
        </div>
      );
    case "photo_booth":
      return (
        <div className={cn(frame, "rounded-xl bg-gradient-to-b from-violet-300 to-violet-500")} aria-hidden>
          <div className="size-7 rounded-lg border-2 border-[#1e293b]/40 bg-white/25" />
        </div>
      );
    case "aisle":
      return (
        <div className={cn(frame, "rounded-lg border-dashed border-stone-600/50 bg-stone-100")} aria-hidden>
          <div className="h-7 w-1.5 rounded-full bg-stone-400/80" />
        </div>
      );
    case "ceremony_arch":
      return (
        <div className={cn(frame, "rounded-xl bg-gradient-to-b from-emerald-200 to-teal-200")} aria-hidden>
          <svg viewBox="0 0 32 24" className="size-9">
            <path d="M4 20 Q16 2 28 20" fill="none" stroke="#14532d" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="10" r="3" fill="#f9a8d4" stroke="#14532d" strokeWidth="1.2" />
          </svg>
        </div>
      );
    case "flower_stand":
      return (
        <div className={cn(frame, "rounded-xl bg-gradient-to-b from-pink-100 to-emerald-50")} aria-hidden>
          <svg viewBox="0 0 28 32" className="size-8">
            <path
              d="M7 25 L8.5 30 H19.5 L21 25 Q14 23 7 25 Z"
              fill="#92400e"
              stroke="#422006"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
            <path d="M14 25 V14" stroke="#166534" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M14 20 Q8 19 6 13" fill="none" stroke="#15803d" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M14 21 Q20 20 22 14" fill="none" stroke="#15803d" strokeWidth="1.3" strokeLinecap="round" />
            <g transform="translate(14 12)">
              {[0, 72, 144, 216, 288].map((deg) => (
                <ellipse
                  key={deg}
                  cx="0"
                  cy="-5.2"
                  rx="4.2"
                  ry="3.4"
                  fill="#fbcfe8"
                  stroke="#9d174d"
                  strokeWidth="0.9"
                  transform={`rotate(${deg})`}
                />
              ))}
              <circle cx="0" cy="0" r="3" fill="#fef08a" stroke="#854d0e" strokeWidth="0.9" />
            </g>
          </svg>
        </div>
      );
    case "speaker":
      return (
        <div className={cn(frame, "rounded-xl bg-gradient-to-b from-slate-300 to-slate-500")} aria-hidden>
          <div className="size-6 rounded-md border-2 border-slate-900/30 bg-slate-600" />
        </div>
      );
    case "projector_screen":
      return (
        <div className={cn(frame, "rounded-md bg-gradient-to-b from-slate-200 to-slate-400")} aria-hidden>
          <div className="h-4 w-9 rounded border-2 border-[#1e293b]/35 bg-slate-100" />
        </div>
      );
    case "bar_area":
      return (
        <div className={cn(frame, "rounded-xl bg-gradient-to-br from-yellow-100 to-sky-100")} aria-hidden>
          <svg viewBox="0 0 28 24" className="size-8">
            <rect x="3" y="10" width="22" height="10" rx="1.5" fill="#fde68a" stroke="#1e293b" strokeWidth="1.2" />
            <rect x="8" y="4" width="4" height="12" rx="0.5" fill="#38bdf8" stroke="#1e293b" strokeWidth="1" />
            <rect x="16" y="4" width="4" height="12" rx="0.5" fill="#f472b6" stroke="#1e293b" strokeWidth="1" />
          </svg>
        </div>
      );
    case "lounge_sofa":
      return (
        <div className={cn(frame, "rounded-xl bg-gradient-to-b from-violet-200 to-violet-400")} aria-hidden>
          <svg viewBox="0 0 36 20" className="size-9">
            <path
              d="M3 14 Q3 8 9 8 L27 8 Q33 8 33 14 L33 16 Q33 18 31 18 L5 18 Q3 18 3 16 Z"
              fill="#a78bfa"
              stroke="#1e293b"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      );
    case "plant_decor":
      return (
        <div className={cn(frame, "rounded-xl bg-gradient-to-b from-lime-100 to-emerald-200")} aria-hidden>
          <svg viewBox="0 0 28 32" className="size-8">
            <path d="M14 3 L22 17 L18 17 L24 28 L4 28 L10 17 L6 17 Z" fill="#86efac" stroke="#14532d" strokeWidth="1.4" />
            <rect x="11" y="24" width="6" height="6" rx="0.5" fill="#78350f" stroke="#422006" strokeWidth="1" />
          </svg>
        </div>
      );
    case "reserved_area":
      return (
        <div
          className={cn(
            frame,
            "rounded-xl bg-[repeating-linear-gradient(-45deg,rgba(251,191,36,0.45),rgba(251,191,36,0.45)_6px,#fffbeb_6px,#fffbeb_12px)]",
          )}
          aria-hidden
        />
      );
    case "church_pew":
      return (
        <div className={cn(frame, "rounded-md bg-gradient-to-b from-amber-100 to-amber-600")} aria-hidden>
          <div className="h-2 w-8 rounded-sm border border-[#422006]/50 bg-amber-200/80" />
        </div>
      );
    case "outdoor_tent":
      return (
        <div className={cn(frame, "rounded-xl bg-[repeating-linear-gradient(118deg,#fffbeb_0px,#fffbeb_6px,#fde68a_6px,#fde68a_12px)]")} aria-hidden>
          <div className="mt-1 h-2 w-6 self-start bg-amber-100" style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
        </div>
      );
    case "garden_arbor":
      return (
        <div className={cn(frame, "rounded-lg bg-gradient-to-b from-lime-100 to-emerald-300")} aria-hidden>
          <svg viewBox="0 0 32 24" className="size-8">
            <path d="M4 18 Q16 4 28 18" fill="none" stroke="#166534" strokeWidth="2" />
            <rect x="6" y="16" width="3" height="6" fill="#365314" />
            <rect x="23" y="16" width="3" height="6" fill="#365314" />
          </svg>
        </div>
      );
    case "text_label":
      return (
        <div className={cn(frame, "rounded-lg bg-gradient-to-r from-sky-100 to-indigo-100")} aria-hidden>
          <div className="h-2 w-7 rounded-full bg-[#1e293b]/70" />
        </div>
      );
    default:
      return (
        <div className={cn(frame, "rounded-xl bg-muted")} aria-hidden>
          <div className="size-6 rounded-md border-2 border-dashed border-muted-foreground/40" />
        </div>
      );
  }
}
