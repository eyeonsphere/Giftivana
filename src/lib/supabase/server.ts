/**
 * Server Supabase client — for Server Components, Server Actions, Route Handlers.
 *
 * Reads and writes cookies via `next/headers` so the user's session is
 * available and refreshed automatically. All queries go through RLS as
 * the logged-in user (or anon if no session).
 */
import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll is called from Server Components where cookies are
            // read-only. The middleware / Server Action will pick up the
            // refresh on the next mutable request.
          }
        },
      },
    },
  );
}
