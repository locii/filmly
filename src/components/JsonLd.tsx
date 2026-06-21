/**
 * Renders a JSON-LD <script> for structured data (schema.org).
 * Server component — safe to drop anywhere in a page's tree.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here; no user-controlled </script> sequences survive escaping.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
