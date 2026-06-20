import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { FavouritesProvider } from "@/context/FavouritesContext";

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
        <FavouritesProvider>
          <Navbar />
          <main className="min-h-screen pt-16">{children}</main>
        </FavouritesProvider>
      </body>
    </html>
  );
}
