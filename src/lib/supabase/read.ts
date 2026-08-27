import { createClient } from "@supabase/supabase-js";
import { cache } from "react";

/**
 * Anonymous, cookie-free Supabase client for reading PUBLIC data during render
 * (e.g. published stacks). Because it never touches `cookies()`, pages that use
 * it stay statically renderable / ISR-cacheable instead of being forced dynamic.
 *
 * Use this for public reads only. For anything user-specific, use
 * `@/lib/supabase/server` (cookie-based) which reflects the signed-in session.
 *
 * Memoised per request so repeated calls (e.g. generateMetadata + the page body)
 * reuse one client.
 */
export const createReadClient = cache(() =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  ),
);
