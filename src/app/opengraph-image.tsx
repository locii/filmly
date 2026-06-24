import { ImageResponse } from "next/og";

// Site-wide default social image. Any route with its own openGraph.images
// (film pages, individual stacks) overrides this automatically.
export const runtime = "edge";
export const alt = "FilmStack — Discover films you'll love";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
            <path d="M12 2.5 22 8l-10 5.5L2 8l10-5.5Z" fill="#f77f00" />
            <path d="M2 12l10 5.5L22 12" stroke="#fcbf49" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 15.8l10 5.5 10-5.5" stroke="#eae2b7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>
            <span style={{ color: "#eae2b7" }}>Film</span>
            <span style={{ color: "#f77f00" }}>Stack</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 36, fontSize: 38, color: "#a1a1aa", textAlign: "center" }}>
          Discover films you&apos;ll love — search by vibe, share curated stacks.
        </div>
      </div>
    ),
    { ...size }
  );
}
