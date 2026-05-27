/** Cloudflare “always passes” test site key — dev fallback when env is unset (safe for the browser). */
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

export function getTurnstileSiteKeyForClient(): string | undefined {
  const fromEnv = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "development") return TURNSTILE_TEST_SITE_KEY;
  return undefined;
}
