import { BRAND_ICON_PATHS } from "@/lib/providerIconPaths";
import { normalizeProviderName } from "@/lib/providerNames";

// Short labels for popular services with no monochrome brand glyph available
// (simple-icons dropped Amazon/Disney/etc. over brand-policy requests).
const FALLBACK_LABELS: Record<string, string> = {
  amazon: "prime",
  disneyplus: "D+",
  hulu: "hulu",
  peacock: "pck",
  bbciplayer: "BBC",
  now: "NOW",
  nowtv: "NOW",
  skystore: "Sky",
};

// Resolve a provider name to a brand-glyph token, covering TMDB's naming
// variants. Returns null when we have no glyph (caller renders initials).
function iconToken(canonical: string): string | null {
  if (BRAND_ICON_PATHS[canonical]) return canonical;
  if (canonical.startsWith("itvx")) return "itvx";
  if (canonical.startsWith("paramount")) return "paramountplus";
  if (canonical.startsWith("rakuten")) return "rakuten";
  if (canonical.includes("netflix")) return "netflix";
  if (canonical.includes("googleplay") || canonical.includes("google")) return "googleplay";
  if (canonical.includes("youtube")) return "youtube";
  if (canonical.includes("appletv")) return "appletv";
  if (canonical.includes("channel4") || canonical.includes("all4")) return "channel4";
  if (canonical.includes("hbo") || canonical === "max") return "max";
  if (canonical.includes("sky")) return "sky";
  return null;
}

function fallbackLabel(canonical: string, name: string): string {
  if (FALLBACK_LABELS[canonical]) return FALLBACK_LABELS[canonical];
  const words = name.replace(/[^a-zA-Z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}

/**
 * Flat monochrome provider mark. Renders the brand glyph (single colour, no
 * box) when known, otherwise a thin-outlined initials chip. Colour follows
 * `currentColor`, so the parent controls the muted/hover shades.
 */
export default function ProviderIcon({ name, size = 20 }: { name: string; size?: number }) {
  const canonical = normalizeProviderName(name);
  const token = iconToken(canonical);

  if (token) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        aria-hidden="true"
        className="shrink-0"
      >
        <path d={BRAND_ICON_PATHS[token]} />
      </svg>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="shrink-0 inline-flex items-center justify-center rounded border border-current font-semibold leading-none"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {fallbackLabel(canonical, name)}
    </span>
  );
}
