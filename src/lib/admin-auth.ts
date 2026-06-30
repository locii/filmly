// Server-only: imports next/headers transitively via the server supabase client.
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import type { User } from "@supabase/supabase-js";

/**
 * Resolve the signed-in user, but only if they're an admin (email in the
 * ADMIN_EMAILS allowlist). Returns null otherwise. Use this to gate every admin
 * page and API route before touching the service-role client.
 */
export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}
