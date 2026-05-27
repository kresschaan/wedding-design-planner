import type { CanvasObject } from "@/types/layout";

export const WDP_CLIPBOARD_KEY = "wdpClipboard" as const;
export const WDP_CLIPBOARD_VERSION = 1 as const;

export type WdpClipboardPayload = {
  [WDP_CLIPBOARD_KEY]: typeof WDP_CLIPBOARD_VERSION;
  objects: CanvasObject[];
};

export function serializeLayoutClipboard(objects: CanvasObject[]): string {
  const payload: WdpClipboardPayload = {
    wdpClipboard: WDP_CLIPBOARD_VERSION,
    objects: structuredClone(objects),
  };
  return JSON.stringify(payload);
}

export function parseLayoutClipboard(text: string): CanvasObject[] | null {
  try {
    const v = JSON.parse(text) as Partial<WdpClipboardPayload>;
    if (
      v &&
      v.wdpClipboard === WDP_CLIPBOARD_VERSION &&
      Array.isArray(v.objects) &&
      v.objects.length > 0
    ) {
      return v.objects as CanvasObject[];
    }
  } catch {
    /* ignore */
  }
  return null;
}
