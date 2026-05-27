/**
 * Cloudflare Turnstile — server-side token verification.
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Cloudflare “always passes” test secret — dev-only fallback (never ship to client). */
const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

export function getTurnstileSecretKey(): string | undefined {
  const fromEnv = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "development") return TURNSTILE_TEST_SECRET_KEY;
  return undefined;
}

export type TurnstileVerifyResult =
  | { success: true }
  | { success: false; error: "missing_secret" | "network" | "invalid_token" };

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteip: string | undefined,
): Promise<TurnstileVerifyResult> {
  const secret = getTurnstileSecretKey();
  if (!secret) {
    return { success: false, error: "missing_secret" };
  }
  if (!token?.trim()) {
    return { success: false, error: "invalid_token" };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token.trim());
  if (remoteip) {
    body.set("remoteip", remoteip);
  }

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      return { success: false, error: "network" };
    }
    const data = (await res.json()) as { success?: boolean };
    if (data.success === true) {
      return { success: true };
    }
    return { success: false, error: "invalid_token" };
  } catch {
    return { success: false, error: "network" };
  }
}
