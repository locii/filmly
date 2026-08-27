"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DiscoverPanel from "@/components/DiscoverPanel";

/**
 * Home-page hero. The signed-in vs. signed-out variant is resolved in the
 * browser so the page itself renders statically (ISR) rather than being forced
 * dynamic by a server-side `auth.getUser()` call on every request.
 */
export default function HomeHero() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setSignedIn(!!data.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session?.user);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (signedIn) {
    return (
      <>
        <h1 className="text-4xl font-bold text-white mb-3">What kind of film do you want to watch?</h1>
        <DiscoverPanel />
      </>
    );
  }

  return (
    <>
      <h1 className="text-4xl font-bold text-white mb-3">Find your next favourite film.</h1>
      <p className="text-zinc-400 text-lg">
        Break free from streaming service algorithms and discover films that truly speak to you.<br /> Create and share thoughtful collections of movies that have shaped, moved, or inspired you.
      </p>
    </>
  );
}
