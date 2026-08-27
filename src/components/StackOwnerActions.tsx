"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Owner-only "Edit stack" affordance. This lives in a client component so the
 * stack page itself can render statically (ISR) for everyone — the ownership
 * check runs in the browser against the visitor's session instead of forcing a
 * per-request server render + auth round-trip.
 */
export default function StackOwnerActions({
  slug,
  createdBy,
}: {
  slug: string;
  createdBy: string | null;
}) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!createdBy) return;
    const supabase = createClient();
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setIsOwner(data.user?.id === createdBy);
    });
    return () => {
      cancelled = true;
    };
  }, [createdBy]);

  if (!isOwner) return null;

  return (
    <Link
      href={`/my-stacks/${slug}/edit`}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      Edit stack
    </Link>
  );
}
