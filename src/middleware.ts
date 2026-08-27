import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Safety net: if a magic-link / OAuth code lands anywhere other than the
  // callback route (e.g. Supabase fell back to the Site URL root), forward it
  // to /auth/callback so the session actually gets exchanged.
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname !== "/auth/callback") {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  // Anonymous visitor (no Supabase session cookie) — the vast majority of traffic,
  // including search-engine/AI crawlers. There's no session to refresh, so skip
  // instantiating the Supabase client and the `auth.getUser()` network round-trip
  // entirely. This is the per-request work that was running on 100% of requests.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));
  if (!hasAuthCookie) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  // Middleware runs *before* the CDN cache is consulted, so a matched path costs
  // an edge invocation on every hit even when the response is ISR/s-maxage cached.
  // The previous catch-all matcher therefore billed for `/films/*`, `/genres/*`,
  // the cached TMDB proxy routes, sitemap.xml and robots.txt — none of which read
  // the session — plus all crawler traffic to them.
  //
  // Only these paths touch cookies server-side (via @/lib/supabase/server or
  // @/lib/admin-auth) and so actually need the session refresh below. Everything
  // else is either public, or client-rendered where supabase-js refreshes its own
  // token in the browser (e.g. /watchlist, /stacks/new).
  //
  // `:path*` matches zero or more segments, so "/profile/:path*" covers "/profile".
  matcher: [
    "/",                              // only for the ?code= safety net above
    "/profile/:path*",
    "/my-stacks/:path*",
    "/admin/:path*",
    "/u/:path*",
    "/api/profile/:path*",
    "/api/stacks/:path*",
    "/api/recommendations/:path*",
    "/api/discover/:path*",
    "/api/admin/:path*",
  ],
};
