"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * Site chrome (nav + footer + main padding).
 *
 * Omitted on /signin, to keep the sign-in screen free of distractions. The
 * rest of the site is public and browsable signed-out, so this is purely a
 * presentational choice now — it is no longer load-bearing.
 */
export default function SiteFrame({ children }: { children: React.ReactNode }) {
  if (usePathname() === "/signin") return <>{children}</>;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">{children}</main>
      <Footer />
    </>
  );
}
