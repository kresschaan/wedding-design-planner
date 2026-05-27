import { headers } from "next/headers";

/**
 * Public site origin for Supabase redirect URLs (server actions / route handlers).
 */
export async function getRequestOrigin(): Promise<string | null> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function getClientIp(): Promise<string | undefined> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }
  return h.get("x-real-ip") ?? undefined;
}
