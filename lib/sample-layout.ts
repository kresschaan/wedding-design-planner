import type {
  CanvasObject,
  CanvasObjectMeta,
  CanvasObjectType,
  LayoutJsonDocument,
} from "@/types/layout";

const GOLD = "#fbbf24";
const WOOD = "#d4a574";
const LINEN = "#ffedd5";
const GREEN = "#86efac";
const SLATE = "#64748b";

export function emptyLayoutDocument(): LayoutJsonDocument {
  return { version: 1, objects: [] };
}

function obj(
  partial: Omit<CanvasObject, "id" | "meta"> & {
    id?: string;
    meta?: CanvasObjectMeta;
  },
): CanvasObject {
  return {
    id: partial.id ?? crypto.randomUUID(),
    ...partial,
    meta: partial.meta ?? {},
  };
}

/**
 * Sample ballroom reception (cool-climate / garden-resort style): stage, dance floor,
 * sweetheart table, guest rounds, buffet, registration, and flow labels.
 */
export function getBccSampleLayoutObjects(): CanvasObject[] {
  return [
    obj({
      type: "stage",
      x: 420,
      y: 40,
      width: 360,
      height: 100,
      rotation: 0,
      label: "Stage & backdrop",
      color: SLATE,
      meta: { notes: "Garden-view side — evergreen and fern backdrop" },
    }),
    obj({
      type: "ceremony_arch",
      x: 520,
      y: 60,
      width: 160,
      height: 60,
      rotation: 0,
      label: "Floral arch",
      color: GREEN,
    }),
    obj({
      type: "dance_floor",
      x: 440,
      y: 200,
      width: 320,
      height: 220,
      rotation: 0,
      label: "Dance floor",
      color: "#d8cfc0",
      meta: {},
    }),
    obj({
      type: "sweetheart_table",
      x: 540,
      y: 160,
      width: 120,
      height: 60,
      rotation: 0,
      label: "Sweetheart",
      color: GOLD,
      meta: { seatCount: 2, guestNames: ["Couple"] },
    }),
    obj({
      type: "round_table",
      x: 200,
      y: 220,
      width: 96,
      height: 96,
      rotation: 0,
      label: "Table 1",
      color: LINEN,
      meta: { seatCount: 8, guestNames: [] },
    }),
    obj({
      type: "round_table",
      x: 200,
      y: 380,
      width: 96,
      height: 96,
      rotation: 0,
      label: "Table 2",
      color: LINEN,
      meta: { seatCount: 8, guestNames: [] },
    }),
    obj({
      type: "round_table",
      x: 200,
      y: 540,
      width: 96,
      height: 96,
      rotation: 0,
      label: "Table 3",
      color: LINEN,
      meta: { seatCount: 8, guestNames: [] },
    }),
    obj({
      type: "round_table",
      x: 900,
      y: 220,
      width: 96,
      height: 96,
      rotation: 0,
      label: "Table 4",
      color: LINEN,
      meta: { seatCount: 8, guestNames: [] },
    }),
    obj({
      type: "round_table",
      x: 900,
      y: 380,
      width: 96,
      height: 96,
      rotation: 0,
      label: "Table 5",
      color: LINEN,
      meta: { seatCount: 8, guestNames: [] },
    }),
    obj({
      type: "round_table",
      x: 900,
      y: 540,
      width: 96,
      height: 96,
      rotation: 0,
      label: "Table 6",
      color: LINEN,
      meta: { seatCount: 8, guestNames: [] },
    }),
    obj({
      type: "rectangular_table",
      x: 80,
      y: 620,
      width: 200,
      height: 64,
      rotation: 0,
      label: "VIP family",
      color: LINEN,
      meta: { seatCount: 10, guestNames: [] },
    }),
    obj({
      type: "buffet_table",
      x: 40,
      y: 40,
      width: 280,
      height: 56,
      rotation: 0,
      label: "Buffet line",
      color: WOOD,
      meta: { notes: "Regional cold & warm stations — lechon carving optional" },
    }),
    obj({
      type: "dessert_table",
      x: 40,
      y: 120,
      width: 120,
      height: 48,
      rotation: 0,
      label: "Dessert",
      color: LINEN,
    }),
    obj({
      type: "registration_table",
      x: 1000,
      y: 40,
      width: 140,
      height: 56,
      rotation: 0,
      label: "Registration",
      color: LINEN,
      meta: { seatCount: 2 },
    }),
    obj({
      type: "gift_table",
      x: 1000,
      y: 120,
      width: 100,
      height: 48,
      rotation: 0,
      label: "Gifts",
      color: LINEN,
    }),
    obj({
      type: "photo_booth",
      x: 1000,
      y: 640,
      width: 120,
      height: 80,
      rotation: 0,
      label: "Photo booth",
      color: "#6a5acd",
    }),
    obj({
      type: "bar_area",
      x: 360,
      y: 640,
      width: 160,
      height: 72,
      rotation: 0,
      label: "Bar",
      color: WOOD,
      meta: { seatCount: 4 },
    }),
    obj({
      type: "lounge_sofa",
      x: 540,
      y: 640,
      width: 200,
      height: 72,
      rotation: 0,
      label: "Lounge",
      color: "#6d5b4c",
    }),
    obj({
      type: "speaker",
      x: 400,
      y: 150,
      width: 40,
      height: 40,
      rotation: 0,
      label: "L",
      color: "#333",
    }),
    obj({
      type: "speaker",
      x: 760,
      y: 150,
      width: 40,
      height: 40,
      rotation: 0,
      label: "R",
      color: "#333",
    }),
    obj({
      type: "projector_screen",
      x: 500,
      y: 50,
      width: 200,
      height: 12,
      rotation: 0,
      label: "Screen",
      color: "#222",
    }),
    obj({
      type: "aisle",
      x: 580,
      y: 220,
      width: 40,
      height: 420,
      rotation: 0,
      label: "Aisle",
      color: "#e8e2d8",
    }),
    obj({
      type: "entrance",
      x: 560,
      y: 720,
      width: 80,
      height: 40,
      rotation: 0,
      label: "Entrance",
      color: GREEN,
    }),
    obj({
      type: "exit",
      x: 660,
      y: 720,
      width: 80,
      height: 40,
      rotation: 0,
      label: "Exit — lawn",
      color: GREEN,
    }),
    obj({
      type: "flower_stand",
      x: 360,
      y: 480,
      width: 36,
      height: 36,
      rotation: 0,
      label: "",
      color: GREEN,
    }),
    obj({
      type: "flower_stand",
      x: 804,
      y: 480,
      width: 36,
      height: 36,
      rotation: 0,
      label: "",
      color: GREEN,
    }),
    obj({
      type: "plant_decor",
      x: 320,
      y: 600,
      width: 32,
      height: 32,
      rotation: 0,
      label: "",
      color: GREEN,
    }),
    obj({
      type: "reserved_area",
      x: 720,
      y: 40,
      width: 200,
      height: 80,
      rotation: 0,
      label: "Reserved — cordon",
      color: "#c9b8a0",
      meta: { notes: "Cool evening air — shawls basket by the door" },
    }),
    obj({
      type: "chair",
      x: 170,
      y: 200,
      width: 28,
      height: 28,
      rotation: 0,
      label: "",
      color: WOOD,
    }),
    obj({
      type: "text_label",
      x: 420,
      y: 8,
      width: 360,
      height: 24,
      rotation: 0,
      label: "Grand ballroom — sample floor plan",
      color: "#3d3a36",
      meta: {},
    }),
  ];
}

export function bccSampleDocument(): LayoutJsonDocument {
  return {
    version: 1,
    objects: getBccSampleLayoutObjects(),
  };
}

export const DEFAULT_CANVAS_WIDTH = 1200;
export const DEFAULT_CANVAS_HEIGHT = 800;

export function defaultObjectForType(type: CanvasObjectType): Omit<
  CanvasObject,
  "id"
> {
  const defaults: Record<
    CanvasObjectType,
    { w: number; h: number; color: string; label: string }
  > = {
    round_table: { w: 88, h: 88, color: LINEN, label: "Round table" },
    rectangular_table: { w: 160, h: 72, color: LINEN, label: "Banquet table" },
    chair: { w: 28, h: 28, color: WOOD, label: "" },
    sweetheart_table: { w: 112, h: 56, color: GOLD, label: "Sweetheart" },
    stage: { w: 320, h: 96, color: SLATE, label: "Stage" },
    dance_floor: { w: 240, h: 200, color: "#d8cfc0", label: "Dance floor" },
    entrance: { w: 72, h: 40, color: GREEN, label: "Entrance" },
    exit: { w: 72, h: 40, color: GREEN, label: "Exit" },
    buffet_table: { w: 200, h: 56, color: WOOD, label: "Buffet" },
    dessert_table: { w: 120, h: 48, color: LINEN, label: "Dessert" },
    registration_table: { w: 140, h: 56, color: LINEN, label: "Registration" },
    photo_booth: { w: 100, h: 72, color: "#c4b5fd", label: "Photo booth" },
    aisle: { w: 48, h: 200, color: "#e8e2d8", label: "Aisle" },
    ceremony_arch: { w: 140, h: 64, color: GREEN, label: "Arch" },
    flower_stand: { w: 32, h: 32, color: GREEN, label: "" },
    speaker: { w: 36, h: 36, color: "#94a3b8", label: "Speaker" },
    projector_screen: { w: 160, h: 14, color: "#cbd5e1", label: "Screen" },
    bar_area: { w: 140, h: 64, color: WOOD, label: "Bar" },
    gift_table: { w: 96, h: 48, color: LINEN, label: "Gifts" },
    lounge_sofa: { w: 180, h: 64, color: "#c4b5fd", label: "Lounge" },
    plant_decor: { w: 32, h: 32, color: GREEN, label: "" },
    reserved_area: { w: 160, h: 72, color: "#c9b8a0", label: "Reserved" },
    text_label: { w: 200, h: 28, color: "#38bdf8", label: "Label" },
  };
  const d = defaults[type];
  return {
    type,
    x: 120,
    y: 120,
    width: d.w,
    height: d.h,
    rotation: 0,
    label: d.label,
    color: d.color,
    meta:
      type === "round_table" || type === "rectangular_table"
        ? { seatCount: 8, guestNames: [] }
        : type === "sweetheart_table"
          ? { seatCount: 2, guestNames: [] }
          : {},
  };
}
