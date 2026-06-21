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
