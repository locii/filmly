import type { SupabaseClient } from "@supabase/supabase-js";

// A signup counts as "stale unverified" once its magic-link email has been out
// for this long without the person ever clicking it (auth.users.created_at is
// stamped when that first email is sent).
export const STALE_UNVERIFIED_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface StaleUser {
  id: string;
  email: string | null;
  created_at: string;
}

/**
 * Find "stale unverified" users: their magic-link email was sent more than 24h
 * ago, they never signed in (last_sign_in_at is null), and they own zero stacks
 * and zero interactions. These are dead signups safe to remove.
 *
 * Takes a service-role client (bypasses RLS). The caller MUST admin-gate first.
 * Deliberately mirrors the deletion criteria exactly so a preview and a purge
 * always agree on the same set.
 */
export async function findStaleUnverifiedUsers(
  supabase: SupabaseClient,
  now: number = Date.now(),
): Promise<StaleUser[]> {
  const [usersRes, stacksRes, interactionsRes] = await Promise.all([
    // Mirrors the admin dashboard's page size; users beyond 1000 aren't paged.
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase.from("published_stacks").select("created_by"),
    supabase.from("film_interactions").select("user_id"),
  ]);

  const withStacks = new Set(
    ((stacksRes.data ?? []) as { created_by: string | null }[])
      .map((s) => s.created_by)
      .filter((v): v is string => !!v),
  );
  const withInteractions = new Set(
    ((interactionsRes.data ?? []) as { user_id: string }[]).map((i) => i.user_id),
  );

  const cutoff = now - STALE_UNVERIFIED_MAX_AGE_MS;

  return (usersRes.data?.users ?? [])
    .filter((u) => {
      if (u.last_sign_in_at) return false; // has logged in at least once
      if (new Date(u.created_at).getTime() > cutoff) return false; // email <24h old
      if (withStacks.has(u.id)) return false; // has published a stack
      if (withInteractions.has(u.id)) return false; // has film interactions
      return true;
    })
    .map((u) => ({ id: u.id, email: u.email ?? null, created_at: u.created_at }));
}
