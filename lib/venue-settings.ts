import type { LayoutJsonDocument } from "@/types/layout";
import type { VenueSetting } from "@/types/layout";
import {
  bccSampleDocument,
  churchSampleDocument,
  emptyLayoutDocument,
  gardenSampleDocument,
} from "@/lib/sample-layout";

export const VENUE_PRESET_LABELS: Record<
  VenueSetting,
  { title: string; description: string; defaultVenueName: string; defaultLocation: string }
> = {
  ballroom: {
    title: "Ballroom / reception",
    description: "Indoor dinner dance, stage, buffet, and guest tables.",
    defaultVenueName: "Grand ballroom",
    defaultLocation: "City venue",
  },
  church: {
    title: "Church / ceremony",
    description: "Nave, aisle, arch, and seating for the service.",
    defaultVenueName: "Parish church",
    defaultLocation: "Sanctuary",
  },
  outdoor_garden: {
    title: "Outdoor / garden",
    description: "Lawn, tent, arbor, and open-air reception flow.",
    defaultVenueName: "Garden estate",
    defaultLocation: "Outdoor lawn",
  },
};

export const VENUE_DEFAULT_CANVAS: Record<VenueSetting, { width: number; height: number }> = {
  ballroom: { width: 1520, height: 1120 },
  church: { width: 900, height: 1300 },
  outdoor_garden: { width: 1600, height: 950 },
};

export function initialLayoutDocumentForVenue(
  venue: VenueSetting,
  useTemplate: boolean,
): LayoutJsonDocument {
  if (!useTemplate) return emptyLayoutDocument();
  switch (venue) {
    case "ballroom":
      return bccSampleDocument();
    case "church":
      return churchSampleDocument();
    case "outdoor_garden":
      return gardenSampleDocument();
    default:
      return emptyLayoutDocument();
  }
}

export function parseVenueSetting(raw: unknown): VenueSetting {
  if (raw === "church" || raw === "outdoor_garden" || raw === "ballroom") {
    return raw;
  }
  return "ballroom";
}

export function clampCanvasDimension(n: number, fallback: number): number {
  const x = Number.isFinite(n) ? Math.round(n) : fallback;
  return Math.min(5600, Math.max(400, x));
}
