"use client";

import Image from "next/image";
import { useState, useRef } from "react";

interface Props {
  backdropUrl: string | null;
  title: string;
  trailerKey?: string;
}

export default function HeroSection({ backdropUrl, title, trailerKey }: Props) {
  const [trailerReady, setTrailerReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function postYT(func: string) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args: "" }),
      "*"
    );
  }

  function toggleMute() {
    postYT(muted ? "unMute" : "mute");
    setMuted((m) => !m);
  }

  function handleFullscreen() {
    iframeRef.current?.requestFullscreen?.();
  }

  return (
    <div className="relative h-72 sm:h-[480px] w-full overflow-hidden">
      {/* Static backdrop */}
      {backdropUrl && (
        <Image
          src={backdropUrl}
          alt={title}
          fill
          className={`object-cover transition-opacity duration-1000 ${trailerReady ? "opacity-0" : "opacity-100"}`}
          priority
        />
      )}

      {/* Muted autoplay trailer */}
      {trailerKey && (
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&loop=1&playlist=${trailerKey}&controls=0&disablekb=1&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&enablejsapi=1`}
          title={`${title} trailer`}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          className={`absolute w-[300%] h-[300%] -top-[100%] -left-[100%] pointer-events-none transition-opacity duration-1000 ${trailerReady ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setTimeout(() => setTrailerReady(true), 1500)}
        />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/60 to-transparent pointer-events-none" />

      {/* Controls — only shown when trailer is playing */}
      {trailerReady && trailerKey && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
          <button
            onClick={toggleMute}
            title={muted ? "Unmute" : "Mute"}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
          >
            {muted ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3.5-3.5M12 18l3.5-3.5M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleFullscreen}
            title="Fullscreen"
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
