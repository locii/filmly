"use client";

export default function FilmError({ error }: { error: Error }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <p className="text-red-400 font-mono text-sm">{error.message}</p>
    </div>
  );
}
