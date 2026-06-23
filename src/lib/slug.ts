/**
 * Turn a free-text search term into a human-friendly URL slug.
 * "Films about psychedelics" → "films-about-psychedelics"
 */
export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/['"’]/g, "")          // drop quotes/apostrophes outright
    .replace(/[^a-z0-9]+/g, "-")    // everything else → single dashes
    .replace(/^-+|-+$/g, "")        // trim leading/trailing dashes
    .slice(0, 80)
    .replace(/-+$/g, "");           // re-trim in case slice() left a dash

  return slug || "stack";
}

/** Pick `base`, or `base-N` for the smallest N≥2 not already taken. */
export function nextFreeSlug(base: string, taken: string[]): string {
  const set = new Set(taken);
  if (!set.has(base)) return base;
  let n = 2;
  while (set.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
