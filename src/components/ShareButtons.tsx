"use client";

import { useState } from "react";

interface Props {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  const shareText = `${title} · a film stack on FilmStack`;
  const enc = encodeURIComponent;

  const targets = [
    {
      name: "X",
      href: `https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(url)}`,
      icon: (
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      ),
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      icon: (
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      ),
    },
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${enc(`${shareText} ${url}`)}`,
      icon: (
        <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.748-.985a9.86 9.86 0 002.62.378zm5.943-7.247c-.297-.149-1.758-.867-2.03-.967-.272-.099-.47-.148-.669.15-.198.296-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.668-1.612-.916-2.207-.241-.579-.486-.5-.668-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      ),
    },
    {
      name: "Reddit",
      href: `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}`,
      icon: (
        <path d="M24 11.779c0-1.459-1.192-2.645-2.657-2.645-.715 0-1.363.286-1.84.746-1.81-1.191-4.259-1.949-6.971-2.046l1.483-4.669 4.016.948-.006.036c0 1.193.975 2.163 2.174 2.163 1.198 0 2.172-.97 2.172-2.163s-.974-2.164-2.172-2.164c-.857 0-1.59.497-1.951 1.213l-4.439-1.048c-.179-.043-.366.06-.426.235l-1.66 5.232c-2.753.07-5.244.828-7.08 2.032-.475-.453-1.119-.736-1.83-.736C1.192 9.134 0 10.32 0 11.779c0 1.079.651 2.004 1.583 2.412-.04.169-.06.342-.06.518 0 3.43 4.232 6.21 9.449 6.21 5.218 0 9.45-2.78 9.45-6.21 0-.176-.02-.348-.059-.518.932-.408 1.583-1.333 1.583-2.412zm-17.945 1.92c0-.969.785-1.754 1.754-1.754.969 0 1.754.785 1.754 1.754 0 .968-.785 1.753-1.754 1.753-.969 0-1.754-.785-1.754-1.753zm9.687 4.041c-1.184 1.185-3.445 1.272-4.085 1.272-.639 0-2.901-.087-4.085-1.272a.408.408 0 010-.578.41.41 0 01.578 0c.747.749 2.345.812 3.507.812 1.162 0 2.76-.063 3.507-.812a.41.41 0 01.578 0 .41.41 0 010 .578zm-.235-2.288c-.969 0-1.754-.785-1.754-1.753 0-.969.785-1.754 1.754-1.754.969 0 1.754.785 1.754 1.754 0 .968-.785 1.753-1.754 1.753z" />
      ),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {typeof navigator !== "undefined" && "share" in navigator && (
        <button
          type="button"
          onClick={() => navigator.share({ title, text: shareText, url }).catch(() => {})}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
      )}

      {targets.map((t) => (
        <a
          key={t.name}
          href={t.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`Share on ${t.name}`}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">{t.icon}</svg>
        </a>
      ))}

      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 hover:text-white px-3 py-2 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
