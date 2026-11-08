/**
 * Admin (service-role) Supabase client — server-only, bypasses RLS.
 *
 * Use this ONLY inside explicitly authorised code paths:
 * - Checkout / order creation (after server-side validation)
 * - Admin actions (after requireAdmin())
 * - Fulfillment reveal (after entitlement check)
 *
 * Never import this from anything reachable by a client bundle.
 */
import "server-only";

import { createClient as _createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return _createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
