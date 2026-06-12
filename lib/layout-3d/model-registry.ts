import type { CanvasObjectType } from "@/types/layout";

export interface ModelAttribution {
  /** Human-readable model title. */
  title: string;
  /** SPDX-ish license id shown to users. */
  license: string;
  /** Credit line (required for CC BY assets). */
  credit: string;
  /** Whether this license requires visible attribution in the UI. */
  requiresAttribution: boolean;
}

export interface ModelAsset {
  /** Public path served from /public. */
  url: string;
  /**
   * How the model footprint maps to the object's canvas footprint.
   * "fit" scales uniformly so the model's X/Z extent fits inside (fx, fz).
   */
  fit: "fit";
  /** Extra uniform scale multiplier applied after fitting (visual tuning). */
  scaleMultiplier?: number;
  /**
   * If set, the model is scaled to this real-world width (meters) instead of the
   * object's 2D footprint. Use for items (e.g. chairs) whose canvas footprint is
   * too small to read at a realistic human scale.
   */
  targetWidthMeters?: number;
  /** Yaw offset (radians) so the model's "front" matches the canvas rotation. */
  yawOffset?: number;
  attribution: ModelAttribution;
}

/**
 * Object types we render with a real (license-cleared, locally vendored) GLB.
 * Anything not listed here falls back to the procedural primitive meshes.
 */
const KENNEY_ATTR: ModelAttribution = {
  title: "Furniture Kit",
  license: "CC0 1.0",
  credit: "Kenney.nl",
  requiresAttribution: false,
};

function kenney(file: string, scaleMultiplier = 1, yawOffset = 0): ModelAsset {
  return {
    url: `/models/furniture/${file}`,
    fit: "fit",
    scaleMultiplier,
    yawOffset,
    attribution: KENNEY_ATTR,
  };
}

const MODEL_REGISTRY: Partial<Record<CanvasObjectType, ModelAsset>> = {
  chair: {
    url: "/models/furniture/SheenChair.glb",
    fit: "fit",
    // Banquet chair ~0.5 m wide / ~0.85 m tall so it reads at human scale next
    // to the tables (the 2D chair footprint is far too small for 3D).
    targetWidthMeters: 0.52,
    scaleMultiplier: 1.0,
    yawOffset: Math.PI,
    attribution: {
      title: "Sheen Chair",
      license: "CC0 1.0",
      credit: "Wayfair, LLC (Eric Chadwick)",
      requiresAttribution: false,
    },
  },
  lounge_sofa: {
    url: "/models/furniture/SheenWoodLeatherSofa.glb",
    fit: "fit",
    scaleMultiplier: 1.0,
    yawOffset: Math.PI,
    attribution: {
      title: "Sheen Wood Leather Sofa",
      license: "CC BY 4.0",
      credit: "Darmstadt Graphics Group GmbH; Fran Calvente; Eric Chadwick",
      requiresAttribution: true,
    },
  },

  // Kenney Furniture Kit (CC0) — used for utility furniture.
  // Reception/dining tables are rendered as elegant draped-linen procedural
  // meshes (see ElegantTable), and plant/flower decor as procedural floral
  // arrangements (see FloralArrangement), for a more wedding-appropriate look.
  registration_table: kenney("kenney-desk.glb", 1.0),
  bar_area: kenney("kenney-kitchen-bar.glb", 1.02),
  church_pew: kenney("kenney-bench.glb", 1.0),
};

export function getModelAsset(type: CanvasObjectType): ModelAsset | undefined {
  return MODEL_REGISTRY[type];
}

export function allModelAssets(): ModelAsset[] {
  return Object.values(MODEL_REGISTRY).filter(Boolean) as ModelAsset[];
}

/** Distinct attribution lines for assets that require visible credit. */
export function requiredAttributions(): ModelAttribution[] {
  const seen = new Set<string>();
  const out: ModelAttribution[] = [];
  for (const a of allModelAssets()) {
    if (!a.attribution.requiresAttribution) continue;
    const key = `${a.attribution.title}|${a.attribution.credit}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a.attribution);
  }
  return out;
}
