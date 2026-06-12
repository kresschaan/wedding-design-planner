import type { CanvasObject } from "@/types/layout";

/** All objects that share a group with any selected id, minus locked items. */
export function expandDragIdsForGroups(selectedIds: string[], objects: CanvasObject[]): string[] {
  const byId = new Map(objects.map((o) => [o.id, o] as const));
  const groupIds = new Set<string>();
  for (const id of selectedIds) {
    const g = byId.get(id)?.meta.groupId;
    if (g) groupIds.add(g);
  }
  const out = new Set<string>(selectedIds);
  for (const o of objects) {
    if (o.meta.groupId && groupIds.has(o.meta.groupId)) {
      out.add(o.id);
    }
  }
  return [...out].filter((id) => !byId.get(id)?.meta.locked);
}
