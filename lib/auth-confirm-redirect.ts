/**
 * Redirect target after email confirmation (signup, etc.). Must stay in sync with
 * `/auth/confirm` and Supabase Dashboard → Authentication → Redirect URLs.
 */
export function getEmailAuthConfirmRedirectUrl(siteOrigin: string): string {
  const u = new URL("/auth/confirm", siteOrigin);
  u.searchParams.set("next", "/dashboard");
  return u.toString();
}
