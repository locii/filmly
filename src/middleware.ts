import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Site-wide auth gate.
 *
 * The site is private: nothing renders for anonymous visitors. This exists for
 * cost control as much as privacy — an unauthenticated request is turned away
 * here, at the edge, before any page renders. That means no ISR write, no TMDB
 * fetches, no Data Cache entries. A scraper walking a million film ids gets a
 * million cheap redirects instead of a million cold renders.
 *
 * The cookie-presence check below is deliberately the FIRST thing that happens:
 * bots carry no session cookie, so they never reach the Supabase round-trip.
 */

/** Reachable without a session — everything else redirects to /signin. */
const PUBLIC_PATHS = new Set([
  "/signin",
  "/auth/callback",
  "/robots.txt", // must stay readable so crawlers can see the site-wide Disallow
  "/favicon.ico",
  "/icon.svg",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Safety net: a magic-link code landing anywhere other than the callback
  // (e.g. Supabase fell back to the Site URL root) gets forwarded there.
  const code = request.nextUrl.searchParams.get("code");
  if (code && pathname !== "/auth/callback") {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next({ request });

  const isApi = pathname.startsWith("/api/");

  // No session cookie — the overwhelming majority of traffic, all of it bots.
  // Bail before instantiating a Supabase client or making any network call.
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));
  if (!hasAuthCookie) return denyAnonymous(request, isApi);

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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session as a side effect, and tells us whether the cookie is
  // a real session rather than a leftover or forged one.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return denyAnonymous(request, isApi);

  return supabaseResponse;
}

/** API callers get JSON; page requests get sent to the sign-in screen. */
function denyAnonymous(request: NextRequest, isApi: boolean) {
  if (isApi) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const signInUrl = request.nextUrl.clone();
  signInUrl.pathname = "/signin";
  signInUrl.search = "";
  return NextResponse.redirect(signInUrl);
}

export const config = {
  // Everything except build assets and image files. Broad on purpose: the gate
  // has to cover the whole site, and the anonymous path above is cheap enough
  // to run on every request (a cookie check and a redirect, no I/O).
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
