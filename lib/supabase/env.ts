/**
 * Supabase environment helpers.
 *
 * - Use the **publishable** key (`sb_publishable_...`) for browser and SSR clients — same role as the legacy **anon** JWT.
 * - **Secret** keys (`sb_secret_...`) replace **service_role** and bypass RLS. Never set them in `NEXT_PUBLIC_*` or import them into client code.
 */

export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined;
}

/**
 * Client-safe key for `createBrowserClient` / `createServerClient` with user sessions.
 * Prefers the new name; falls back to legacy anon JWT during migration.
 */
export function getSupabasePublishableKey(): string | undefined {
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (publishable) return publishable;
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || undefined;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function supabaseClientEnvError(): string {
  return (
    "Missing NEXT_PUBLIC_SUPABASE_URL or a client API key. " +
    "Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (recommended) or NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy). " +
    "See .env.example. Do not use secret / service_role keys in NEXT_PUBLIC_ variables."
  );
}
