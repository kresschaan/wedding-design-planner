import type { CanvasObjectType, VenueSetting } from "@/types/layout";

export interface PaletteItem {
  type: CanvasObjectType;
  title: string;
  description?: string;
  /** If set, item appears only when the layout’s venue setting matches. */
  venues?: readonly VenueSetting[];
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
  {
    type: "church_pew",
    title: "Church pew",
    description: "Nave bench — long and narrow; resize to match your rows.",
    venues: ["church"],
  },
  {
    type: "outdoor_tent",
    title: "Outdoor tent",
    description: "Sailcloth or frame tent footprint for lawn receptions.",
    venues: ["outdoor_garden", "ballroom"],
  },
  {
    type: "garden_arbor",
    title: "Garden arbor",
    description: "Pergola or wooden arbor for vows or photos.",
    venues: ["outdoor_garden", "church"],
  },
  { type: "text_label", title: "Text label" },
];

export function paletteItemsForVenue(venue: VenueSetting): PaletteItem[] {
  return PALETTE_ITEMS.filter((item) => !item.venues || item.venues.includes(venue));
}
