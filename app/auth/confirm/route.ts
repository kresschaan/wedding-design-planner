import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Email auth callback: establishes a session from either
 * - **PKCE** (`?code=...`) — default Supabase redirect after the user follows the email link, or
 * - **Token hash** (`?token_hash=...&type=recovery`) — if you customize the email template (works across devices).
 *
 * Add `/auth/confirm` to Supabase → Authentication → URL configuration → Redirect URLs.
 */
export async function GET(request: NextRequest) {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) {
    return NextResponse.redirect(new URL("/auth/auth-code-error", request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/auth/update-password";

  const fail = () => NextResponse.redirect(new URL("/auth/auth-code-error", request.url));

  const safeNext = next.startsWith("/") ? next : "/auth/update-password";
  const successUrl = new URL(safeNext, origin);

  let response = NextResponse.redirect(successUrl);

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        response = NextResponse.redirect(successUrl);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return fail();
    }
    return response;
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (error) {
      return fail();
    }
    return response;
  }

  return fail();
}
