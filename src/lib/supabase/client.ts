/**
 * Browser Supabase client — for Client Components.
 *
 * Uses the public anon key; all queries are RLS-enforced.
 * Import directly: `import { createClient } from "@/lib/supabase/client"`.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
