"use client";

export default function SearchError({ error }: { error: Error }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-center space-y-2">
      <p className="text-zinc-400">Search failed.</p>
      <p className="text-zinc-600 text-sm font-mono">{error.message}</p>
    </div>
  );
}
