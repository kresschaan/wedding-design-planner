import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Next.js Edge (proxy) often cannot `fetch` **loopback** Supabase (`127.0.0.1` / `localhost`):
 * from the Edge sandbox, “localhost” is not your machine, so `getUser()` fails with “fetch failed”.
 * We then use cookie-based `getSession()` so auth gating still works in dev with local Supabase.
 * For hosted `*.supabase.co`, `getUser()` is preferred; on transient network errors we fall back to session.
 */
function supabaseUrlHostname(urlStr: string): string | null {
  try {
    return new URL(urlStr).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isLoopbackHostname(host: string | null): boolean {
  if (!host) return false;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function isLikelyNetworkAuthError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("fetch failed") ||
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("network request failed") ||
    m.includes("econnrefused") ||
    m.includes("enotfound")
  );
}

function logDevOnce(key: string, message: string) {
  if (process.env.NODE_ENV !== "development") return;
  const g = globalThis as unknown as Record<string, boolean>;
  if (g[key]) return;
  g[key] = true;
  console.info(`[middleware] ${message}`);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  let user: User | null = null;
  const host = supabaseUrlHostname(url);
  const loopback = isLoopbackHostname(host);

  const userFromCookies = async (): Promise<User | null> => {
    const { data, error } = await supabase.auth.getSession();
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[middleware] getSession:", error.message);
    }
    return data.session?.user ?? null;
  };

  if (loopback) {
    user = await userFromCookies();
    if (user) {
      logDevOnce(
        "__wdp_supabase_edge_loopback",
        "Local Supabase URL: Edge uses cookie session (getUser is skipped — Edge cannot reach host loopback). " +
          "Use a hosted Supabase URL in .env.local if you need token refresh in proxy.",
      );
    }
  } else {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        user = data.user;
      } else if (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[middleware] Supabase getUser:", error.message);
        }
        if (isLikelyNetworkAuthError(error.message)) {
          user = await userFromCookies();
          if (user && process.env.NODE_ENV === "development") {
            logDevOnce(
              "__wdp_supabase_getuser_fallback",
              "getUser failed on the network; using cookie session for this request. Server pages still validate with getUser where possible.",
            );
          }
        }
      }
    } catch (e) {
      const err = e as Error & { cause?: { code?: string; message?: string } };
      const causeMsg =
        typeof err.cause === "object" && err.cause !== null
          ? `${(err.cause as { code?: string }).code ?? ""} ${(err.cause as { message?: string }).message ?? ""}`.trim()
          : "";
      if (process.env.NODE_ENV === "development") {
        let hostLabel = url;
        try {
          hostLabel = new URL(url).hostname;
        } catch {
          /* keep raw */
        }
        console.warn(
          "[middleware] Supabase auth threw (trying cookie session). " +
            `Target: ${hostLabel}. ${err.message}${causeMsg ? ` (${causeMsg})` : ""}`,
        );
      }
      user = await userFromCookies();
    }
  }

  const path = request.nextUrl.pathname;
  const isProtected =
    path.startsWith("/dashboard") || path.startsWith("/layouts");

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if ((path === "/login" || path === "/signup" || path === "/forgot-password") && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
