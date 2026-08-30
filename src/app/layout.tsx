import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import SiteFrame from "@/components/SiteFrame";
import { FavouritesProvider } from "@/context/FavouritesContext";
import { FollowsProvider } from "@/context/FollowsContext";
import { GenreFollowsProvider } from "@/context/GenreFollowsContext";
import { ActiveStackProvider } from "@/context/ActiveStackContext";
import { AuthPromptProvider } from "@/context/AuthPromptContext";
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
  // Refuse Google Translate's proxy (www-thefilmstack-com.translate.goog).
  // Its fetches arrive from Google infrastructure, so they pass verified-bot
  // exemptions in the Cloudflare rules and hit the origin as cold renders —
  // it was being used to route around the bot blocking entirely.
  other: { google: "notranslate" },
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
                <ActiveStackProvider>
                  <AuthPromptProvider>
                    <SiteFrame>{children}</SiteFrame>
                  </AuthPromptProvider>
                </ActiveStackProvider>
              </GenreFollowsProvider>
            </FollowsProvider>
          </FavouritesProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
