"use server";

import { isPasswordResetRateLimited } from "@/lib/password-reset-rate-limit";
import { getClientIp } from "@/lib/request-origin";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { verifyTurnstileToken } from "@/lib/turnstile";

export type VerifyPasswordResetChallengeResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

/**
 * Validates Turnstile + rate limit so the browser can call `resetPasswordForEmail` with PKCE
 * (code verifier must live in the same cookie jar as the eventual `/auth/confirm` request).
 */
export async function verifyPasswordResetChallenge(
  formData: FormData,
): Promise<VerifyPasswordResetChallengeResult> {
  const rawEmail = String(formData.get("email") ?? "");
  const turnstile = String(formData.get("turnstile") ?? "");

  const parsed = forgotPasswordSchema.safeParse({ email: rawEmail });
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.email?.[0];
    return { ok: false, error: msg ?? "Invalid email" };
  }

  const ip = await getClientIp();
  const rateKey = ip ?? "unknown";
  if (isPasswordResetRateLimited(rateKey)) {
    return {
      ok: false,
      error: "Too many reset attempts. Please try again in a few minutes.",
    };
  }

  const captcha = await verifyTurnstileToken(turnstile, ip);
  if (!captcha.success) {
    if (captcha.error === "missing_secret") {
      return {
        ok: false,
        error: "Password reset is not configured (missing Turnstile secret).",
      };
    }
    return {
      ok: false,
      error: "Human verification failed. Refresh the page and try again.",
    };
  }

  return { ok: true, email: parsed.data.email };
}
