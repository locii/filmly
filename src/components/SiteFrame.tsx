"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * Site chrome (nav + footer + main padding).
 *
 * Omitted on /signin. The site is private, so a signed-out visitor would
 * otherwise be shown a nav bar full of links — Genres, Stacks, search — that
 * all bounce straight back to the sign-in screen.
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
