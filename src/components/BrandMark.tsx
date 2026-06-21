/**
 * FilmStack brand mark — a flat, three-tone "stack" icon using the palette
 * (Princeton Orange / Sunflower Gold / Vanilla). Scales with className.
 */
export default function BrandMark({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.5 22 8l-10 5.5L2 8l10-5.5Z" fill="#f77f00" />
      <path d="M2 12l10 5.5L22 12" stroke="#fcbf49" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 15.8l10 5.5 10-5.5" stroke="#eae2b7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
