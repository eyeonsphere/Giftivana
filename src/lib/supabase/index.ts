/**
 * Supabase client barrel.
 *
 * Import the specific module rather than this barrel when tree-shaking
 * matters (e.g. `import { createClient } from "@/lib/supabase/server"`).
 */
export { createClient } from "./server";
export { createAdminClient } from "./admin";
export { updateSession } from "./middleware";
