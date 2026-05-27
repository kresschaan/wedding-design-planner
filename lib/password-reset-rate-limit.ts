/**
 * Simple in-memory rate limit for password-reset requests (per IP).
 * Fine for a single Node process; on multi-instance serverless, pair with
 * Turnstile + Supabase Auth rate limits or a shared store (e.g. Upstash).
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const buckets = new Map<string, number[]>();

function prune(key: string, now: number): number[] {
  const times = buckets.get(key) ?? [];
  const recent = times.filter((t) => now - t < WINDOW_MS);
  buckets.set(key, recent);
  return recent;
}

export function isPasswordResetRateLimited(clientKey: string): boolean {
  const now = Date.now();
  const recent = prune(clientKey, now);
  if (recent.length >= MAX_PER_WINDOW) {
    return true;
  }
  recent.push(now);
  buckets.set(clientKey, recent);
  return false;
}
