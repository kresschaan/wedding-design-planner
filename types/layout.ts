export const VENUE_SETTINGS = ["ballroom", "church", "outdoor_garden"] as const;
export type VenueSetting = (typeof VENUE_SETTINGS)[number];

export const CANVAS_OBJECT_TYPES = [
  "round_table",
  "rectangular_table",
  "chair",
  "sweetheart_table",
  "stage",
  "dance_floor",
  "entrance",
  "exit",
  "buffet_table",
  "dessert_table",
  "registration_table",
  "photo_booth",
  "aisle",
  "ceremony_arch",
  "flower_stand",
  "speaker",
  "projector_screen",
  "bar_area",
  "gift_table",
  "lounge_sofa",
  "plant_decor",
  "reserved_area",
  "church_pew",
  "outdoor_tent",
  "garden_arbor",
  "text_label",
] as const;

export type CanvasObjectType = (typeof CANVAS_OBJECT_TYPES)[number];

export type TableLikeType =
  | "round_table"
  | "rectangular_table"
  | "sweetheart_table"
  | "buffet_table"
  | "dessert_table"
  | "registration_table"
  | "gift_table"
  | "bar_area";

export function isTableLikeType(t: CanvasObjectType): t is TableLikeType {
  return (
    t === "round_table" ||
    t === "rectangular_table" ||
    t === "sweetheart_table" ||
    t === "buffet_table" ||
    t === "dessert_table" ||
    t === "registration_table" ||
    t === "gift_table" ||
    t === "bar_area"
  );
}

export function isChairType(t: CanvasObjectType): boolean {
  return t === "chair";
}

export interface CanvasObjectMeta {
  seatCount?: number;
  guestNames?: string[];
  /** Single guest for one-seat assets (e.g. chair). */
  guestName?: string;
  notes?: string;
  /** Objects with the same id move together when any member is dragged. */
  groupId?: string;
  /** When true, the object cannot be dragged or resized on the canvas. */
  locked?: boolean;
  /** Chairs auto-placed by “Ring chairs” belong to this table id (for replace on re-run). */
  chairRingForTableId?: string;
}

export interface CanvasObject {
  id: string;
  type: CanvasObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label: string;
  color: string;
  meta: CanvasObjectMeta;
}

export interface LayoutJsonDocument {
  version: 1;
  objects: CanvasObject[];
}

export interface LayoutRow {
  id: string;
  user_id: string;
  name: string;
  venue_name: string;
  location: string;
  venue_setting: VenueSetting;
  canvas_width: number;
  canvas_height: number;
  layout_json: LayoutJsonDocument;
  created_at: string;
  updated_at: string;
}

export interface PalettePreset {
  type: CanvasObjectType;
  label: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultColor: string;
}
