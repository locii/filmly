import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminUsers, { AdminUserRow } from "@/components/admin/AdminUsers";
import AdminStacks, { AdminStackRow } from "@/components/admin/AdminStacks";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Always render fresh — this is an operational dashboard.
export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
      <p className="text-2xl font-bold text-white tabular-nums">{value.toLocaleString()}</p>
      <p className="text-xs uppercase tracking-wider text-zinc-500 mt-1">{label}</p>
    </div>
  );
}

export default async function AdminPage() {
  const admin = await getAdminUser();
  if (!admin) notFound();

  const supabase = createAdminClient();

  // Pull users (auth), every stack, and interaction owners in parallel.
  const [usersRes, stacksRes, interactionsRes] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase
      .from("published_stacks")
      .select("slug, query, total_titles, created_by, author_name, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("film_interactions").select("user_id"),
  ]);

  const authUsers = usersRes.data?.users ?? [];
  const stacks = (stacksRes.data ?? []) as {
    slug: string; query: string; total_titles: number;
    created_by: string | null; author_name: string | null; created_at: string;
  }[];
  const interactions = (interactionsRes.data ?? []) as { user_id: string }[];

  // Tally per-user counts.
  const stacksByUser = new Map<string, number>();
  for (const s of stacks) {
    if (s.created_by) stacksByUser.set(s.created_by, (stacksByUser.get(s.created_by) ?? 0) + 1);
  }
  const interactionsByUser = new Map<string, number>();
  for (const i of interactions) {
    interactionsByUser.set(i.user_id, (interactionsByUser.get(i.user_id) ?? 0) + 1);
  }

  const now = Date.now();
  const userRows: AdminUserRow[] = authUsers.map((u) => {
    const bannedUntil = (u as { banned_until?: string }).banned_until;
    return {
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      banned: !!bannedUntil && new Date(bannedUntil).getTime() > now,
      stacks: stacksByUser.get(u.id) ?? 0,
      interactions: interactionsByUser.get(u.id) ?? 0,
      isSelf: u.id === admin.id,
    };
  });

  const stackRows: AdminStackRow[] = stacks.map((s) => ({
    slug: s.slug,
    query: s.query,
    films: s.total_titles,
    author_name: s.author_name,
    created_at: s.created_at,
  }));

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-brand font-medium">Admin</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400">Manage users and stacks. Be careful — these actions take effect immediately.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Stat label="Users" value={authUsers.length} />
        <Stat label="Stacks" value={stacks.length} />
        <Stat label="Interactions" value={interactions.length} />
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Users <span className="text-zinc-500 font-normal">· {userRows.length}</span></h2>
        <AdminUsers users={userRows} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Stacks <span className="text-zinc-500 font-normal">· {stackRows.length}</span></h2>
        <AdminStacks stacks={stackRows} />
      </section>
    </div>
  );
}
