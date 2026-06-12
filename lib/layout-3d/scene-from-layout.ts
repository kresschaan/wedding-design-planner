import type { CanvasObject, CanvasObjectType } from "@/types/layout";

/** Canvas pixels → meters on the ballroom floor (≈15 m span at 2000 px). */
export const LAYOUT_SCENE_METERS_PER_PX = 0.0075;

/** World XZ (Y-up) for object center; origin at canvas center on the floor. */
export function layoutObjectCenterXZ(
  o: CanvasObject,
  canvasW: number,
  canvasH: number,
  mpp: number = LAYOUT_SCENE_METERS_PER_PX,
): [number, number] {
  const cx = (o.x + o.width / 2) * mpp;
  const cz = (o.y + o.height / 2) * mpp;
  const mx = canvasW * mpp;
  const mz = canvasH * mpp;
  return [cx - mx / 2, cz - mz / 2];
}

export function objectFloorFootprint(
  o: CanvasObject,
  mpp: number = LAYOUT_SCENE_METERS_PER_PX,
): { fx: number; fz: number } {
  return {
    fx: Math.max(0.06, o.width * mpp),
    fz: Math.max(0.06, o.height * mpp),
  };
}

export function parseLayoutColor(hexish: string, fallback = "#c4b5a0"): string {
  const t = hexish.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(t)) return t;
  if (/^#[0-9a-fA-F]{1,2}$/.test(t)) return fallback;
  if (t.startsWith("#") && t.length >= 4) return t.slice(0, 7);
  const noHash = t.replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(noHash)) return `#${noHash}`;
  return fallback;
}

export function meshHeightForType(type: CanvasObjectType): number {
  switch (type) {
    case "round_table":
    case "rectangular_table":
    case "buffet_table":
    case "dessert_table":
    case "registration_table":
    case "gift_table":
    case "bar_area":
      return 0.74;
    case "sweetheart_table":
      return 0.62;
    case "chair":
    case "church_pew":
      return 0.92;
    case "stage":
      return 0.55;
    case "dance_floor":
      return 0.04;
    case "aisle":
      return 0.02;
    case "entrance":
    case "exit":
      return 2.1;
    case "ceremony_arch":
    case "garden_arbor":
    case "outdoor_tent":
      return 2.4;
    case "projector_screen":
    case "speaker":
      return 1.65;
    case "photo_booth":
    case "lounge_sofa":
      return 1.15;
    case "plant_decor":
    case "flower_stand":
      return 1.35;
    case "text_label":
      return 0.08;
    case "reserved_area":
      return 0.03;
    default:
      return 0.55;
  }
}

const LARGE_ZONE_AREA_RATIO = 0.52;

/** Big floor zones (reserved, dance floor, aisle) should not drive camera fit or hide furniture. */
export function objectIsLargeFloorZone(
  o: CanvasObject,
  canvasW: number,
  canvasH: number,
): boolean {
  const ca = canvasW * canvasH;
  if (ca <= 0) return false;
  const ratio = (o.width * o.height) / ca;
  if (ratio < LARGE_ZONE_AREA_RATIO) return false;
  return o.type === "reserved_area" || o.type === "dance_floor" || o.type === "aisle";
}

export function meshMetalRough(type: CanvasObjectType): { metalness: number; roughness: number } {
  if (type === "dance_floor") return { metalness: 0.12, roughness: 0.35 };
  if (type === "stage") return { metalness: 0.06, roughness: 0.55 };
  if (type === "chair" || type === "church_pew") return { metalness: 0.04, roughness: 0.72 };
  if (type === "round_table" || type === "rectangular_table" || type === "sweetheart_table") {
    return { metalness: 0.1, roughness: 0.42 };
  }
  return { metalness: 0.05, roughness: 0.68 };
}
