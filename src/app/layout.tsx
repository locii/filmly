import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import { FavouritesProvider } from "@/context/FavouritesContext";
import { ToastProvider } from "@/context/ToastContext";

export const metadata: Metadata = {
  title: "Filmly",
  description: "Discover films you'll love",
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
