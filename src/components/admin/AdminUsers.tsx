"use client";

import { useState } from "react";
import { useToast } from "@/context/ToastContext";

export interface AdminUserRow {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  banned: boolean;
  stacks: number;
  interactions: number;
  isSelf: boolean;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fmt = (d: string | null) => (d ? dateFmt.format(new Date(d)) : "—");

export default function AdminUsers({ users }: { users: AdminUserRow[] }) {
  const { showToast } = useToast();
  const [rows, setRows] = useState(users);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleBan(u: AdminUserRow) {
    if (busy) return;
    const ban = !u.banned;
    if (ban && !window.confirm(`Ban ${u.email ?? "this user"}? They'll be signed out and blocked from signing in.`)) return;
    setBusy(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ban }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't update user");
      setRows((prev) => prev.map((r) => (r.id === u.id ? { ...r, banned: ban } : r)));
      showToast(ban ? "User banned" : "User reinstated", ban ? "red" : "green");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't update user", "red");
    } finally {
      setBusy(null);
    }
  }

  async function remove(u: AdminUserRow) {
    if (busy) return;
    if (!window.confirm(`Permanently delete ${u.email ?? "this user"} and all their data? This can't be undone.`)) return;
    setBusy(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't delete user");
      setRows((prev) => prev.filter((r) => r.id !== u.id));
      showToast("User deleted", "zinc");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Couldn't delete user", "red");
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return <p className="text-zinc-500 text-sm">No users.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Joined</th>
            <th className="px-4 py-3 font-medium">Last seen</th>
            <th className="px-4 py-3 font-medium text-right">Stacks</th>
            <th className="px-4 py-3 font-medium text-right">Activity</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-900/40">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-zinc-200 truncate">{u.email ?? "—"}</span>
                  {u.isSelf && (
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-brand bg-brand/10 rounded px-1.5 py-0.5">You</span>
                  )}
                  {u.banned && (
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-red-400 bg-red-500/10 rounded px-1.5 py-0.5">Banned</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{fmt(u.created_at)}</td>
              <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{fmt(u.last_sign_in_at)}</td>
              <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">{u.stacks}</td>
              <td className="px-4 py-3 text-right text-zinc-300 tabular-nums">{u.interactions}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  {u.isSelf ? (
                    <span className="text-xs text-zinc-600">—</span>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleBan(u)}
                        disabled={busy === u.id}
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-40 ${
                          u.banned
                            ? "text-green-400 border-green-900/60 hover:bg-green-600 hover:text-white hover:border-green-600"
                            : "text-amber-400 border-amber-900/60 hover:bg-amber-500 hover:text-black hover:border-amber-500"
                        }`}
                      >
                        {busy === u.id ? "…" : u.banned ? "Unban" : "Ban"}
                      </button>
                      <button
                        onClick={() => remove(u)}
                        disabled={busy === u.id}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg border border-red-900/60 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
