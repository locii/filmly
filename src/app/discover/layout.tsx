import type { Metadata } from "next";
import { Suspense } from "react";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Discover films by vibe",
  description:
    "Describe the kind of film you're after — a mood, theme, era, or half-remembered plot — and get matches from across the catalogue.",
  alternates: { canonical: absoluteUrl("/discover") },
  openGraph: {
    title: "Discover films by vibe",
    description:
      "Describe the kind of film you're after and get matches from across the catalogue.",
    url: absoluteUrl("/discover"),
    type: "website",
  },
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
