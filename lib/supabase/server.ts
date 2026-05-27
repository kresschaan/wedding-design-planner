import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  supabaseClientEnvError,
} from "@/lib/supabase/env";

export { isSupabaseConfigured } from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) {
    throw new Error(
      `${supabaseClientEnvError()} Create \`.env.local\` in the project root.`,
    );
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* set from Server Component — ignore */
        }
      },
    },
  });
}
