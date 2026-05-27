import type { CanvasObject, LayoutJsonDocument } from "@/types/layout";

export function parseLayoutJson(raw: unknown): LayoutJsonDocument {
  if (
    raw &&
    typeof raw === "object" &&
    "objects" in raw &&
    Array.isArray((raw as LayoutJsonDocument).objects)
  ) {
    const r = raw as LayoutJsonDocument;
    return { version: 1, objects: r.objects.filter(Boolean) as CanvasObject[] };
  }
  return { version: 1, objects: [] };
}
