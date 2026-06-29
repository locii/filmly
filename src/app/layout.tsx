import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FavouritesProvider } from "@/context/FavouritesContext";
import { FollowsProvider } from "@/context/FollowsContext";
import { GenreFollowsProvider } from "@/context/GenreFollowsContext";
import { ToastProvider } from "@/context/ToastContext";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

// Google Analytics 4 measurement ID. Public by design (exposed client-side).
const GA_ID = "G-78ZMZGLH6J";

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
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
      </head>
      <body>
        <ToastProvider>
          <FavouritesProvider>
            <FollowsProvider>
              <GenreFollowsProvider>
                <Navbar />
                <main className="min-h-screen pt-16">{children}</main>
                <Footer />
              </GenreFollowsProvider>
            </FollowsProvider>
          </FavouritesProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
