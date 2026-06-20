import { Suspense } from "react";

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
