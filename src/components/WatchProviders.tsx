import { normalizeProviderName } from "@/lib/providerNames";
import ProviderIcon from "./ProviderIcon";
import { WatchProviderRegion, WatchProvider } from "@/lib/types";

const CATEGORY_LABELS: { key: keyof WatchProviderRegion; label: string }[] = [
  { key: "flatrate", label: "Stream" },
  { key: "free", label: "Free" },
  { key: "ads", label: "Free with ads" },
  { key: "rent", label: "Rent" },
  { key: "buy", label: "Buy" },
];

function ProviderRow({
  label,
  providers,
  fallbackLink,
  deepLinks,
}: {
  label: string;
  providers: WatchProvider[];
  fallbackLink: string;
  deepLinks: Record<string, string>;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs uppercase tracking-wide text-zinc-500">{label}</span>
      <div className="flex flex-wrap gap-2">
        {providers.map((p) => {
          const href = deepLinks[normalizeProviderName(p.provider_name)] ?? fallbackLink;
          return (
            <a
              key={p.provider_id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={p.provider_name}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              <ProviderIcon name={p.provider_name} size={22} />
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default function WatchProviders({
  region,
  regionCode,
  deepLinks = {},
}: {
  region: WatchProviderRegion;
  regionCode: string;
  deepLinks?: Record<string, string>;
}) {
  const rows = CATEGORY_LABELS.map(({ key, label }) => {
    const providers = region[key];
    if (key === "link" || !Array.isArray(providers) || providers.length === 0) return null;
    return (
      <ProviderRow
        key={key}
        label={label}
        providers={providers}
        fallbackLink={region.link}
        deepLinks={deepLinks}
      />
    );
  }).filter(Boolean);

  if (rows.length === 0) return null;

  const hasDeepLinks = Object.keys(deepLinks).length > 0;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Where to watch</h2>
        <span className="text-xs text-zinc-500">
          {regionCode} · data by {hasDeepLinks ? "Watchmode" : "JustWatch"}
        </span>
      </div>
      <div className="space-y-3">{rows}</div>
    </section>
  );
}
