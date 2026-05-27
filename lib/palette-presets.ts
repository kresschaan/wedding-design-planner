import type { CanvasObjectType } from "@/types/layout";

export interface PaletteItem {
  type: CanvasObjectType;
  title: string;
  description?: string;
}

export const PALETTE_ITEMS: PaletteItem[] = [
  { type: "round_table", title: "Round table" },
  { type: "rectangular_table", title: "Rectangular table" },
  { type: "chair", title: "Chair" },
  { type: "sweetheart_table", title: "Sweetheart table" },
  { type: "stage", title: "Stage" },
  { type: "dance_floor", title: "Dance floor" },
  { type: "entrance", title: "Entrance" },
  { type: "exit", title: "Exit" },
  { type: "buffet_table", title: "Buffet table" },
  { type: "dessert_table", title: "Dessert table" },
  { type: "registration_table", title: "Registration" },
  { type: "photo_booth", title: "Photo booth" },
  { type: "aisle", title: "Aisle" },
  { type: "ceremony_arch", title: "Ceremony arch" },
  { type: "flower_stand", title: "Flower stand" },
  { type: "speaker", title: "Speaker" },
  { type: "projector_screen", title: "Projector / screen" },
  { type: "bar_area", title: "Bar area" },
  { type: "gift_table", title: "Gift table" },
  { type: "lounge_sofa", title: "Lounge sofa" },
  { type: "plant_decor", title: "Plant / decor" },
  { type: "reserved_area", title: "Reserved area" },
  { type: "text_label", title: "Text label" },
];
