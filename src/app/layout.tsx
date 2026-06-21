import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { FavouritesProvider } from "@/context/FavouritesContext";
import { ToastProvider } from "@/context/ToastContext";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

const DEFAULT_DESCRIPTION =
  "Discover films you'll love — search by vibe, browse genres, and share curated stacks.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Discover films you'll love`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    url: SITE_URL,
    title: `${SITE_NAME} — Discover films you'll love`,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Discover films you'll love`,
    description: DEFAULT_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <ToastProvider>
          <FavouritesProvider>
            <Navbar />
            <main className="min-h-screen pt-16 pb-16 sm:pb-0">{children}</main>
            <MobileNav />
          </FavouritesProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
