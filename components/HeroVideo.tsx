"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type HeroVideoProps = {
  /** Clip URLs, e.g. /videos/hero/black-cat.mp4 */
  sources: string[];
  children: React.ReactNode;
};

/** Fisher-Yates, so the clip order differs every load. */
function shuffle(items: string[]): string[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Full-bleed autoplaying video hero.
 *
 * Two stacked <video> layers crossfade into each other: the inactive layer
 * preloads the next clip while the active one plays, so transitions are smooth
 * rather than a black flash.
 *
 * Touch behaviour is the important part on iOS: the media layers are
 * `pointer-events: none`, so a finger dragging across the video is never
 * captured by it and the page scrolls exactly as it would over ordinary
 * content. Nothing here calls preventDefault on touch events, and no
 * `touch-action` is set that would suppress panning. Interactive children opt
 * back in with `pointer-events: auto`.
 */
export function HeroVideo({ sources, children }: HeroVideoProps) {
  const playlist = useMemo(() => shuffle(sources), [sources]);
  const [index, setIndex] = useState(0);
  const [layer, setLayer] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const layerRefs = [
    useRef<HTMLVideoElement>(null),
    useRef<HTMLVideoElement>(null),
  ];

  const usable = playlist.filter((src) => !failed.includes(src));
  const hasVideo = usable.length > 0;

  const currentSrc = hasVideo ? usable[index % usable.length] : null;
  const nextSrc = hasVideo ? usable[(index + 1) % usable.length] : null;

  const advance = useCallback(() => {
    if (!hasVideo || usable.length < 2) {
      // A single clip just loops; nothing to cross-fade to.
      const solo = layerRefs[layer].current;
      if (solo) void solo.play().catch(() => {});
      return;
    }
    setLayer((current) => (current === 0 ? 1 : 0));
    setIndex((current) => current + 1);
  }, [hasVideo, usable.length, layer, layerRefs]);

  // Autoplay needs an explicit play() on iOS even with the autoplay attribute.
  useEffect(() => {
    const active = layerRefs[layer].current;
    if (!active) return;
    void active.play().catch(() => {
      /* Autoplay refused; the poster remains visible. */
    });
  }, [layer, index, layerRefs]);

  const markFailed = useCallback((src: string | null) => {
    if (!src) return;
    setFailed((current) =>
      current.includes(src) ? current : [...current, src],
    );
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-felt-950">
      {/* Media frame: 9:16 on phones, 16:9 from sm up. */}
      <div className="relative aspect-[9/16] w-full sm:aspect-video">
        {/* Poster / fallback treatment, always painted underneath. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(225,72,60,0.35),transparent_60%),radial-gradient(ellipse_at_80%_70%,rgba(216,162,74,0.25),transparent_55%)] bg-felt-950"
        />

        {[0, 1].map((slot) => {
          const src = slot === layer ? currentSrc : nextSrc;
          if (!src) return null;
          return (
            <video
              key={`${slot}-${src}`}
              ref={layerRefs[slot]}
              src={src}
              autoPlay={slot === layer}
              muted
              playsInline
              preload="auto"
              // No `controls`, and no loop — `onEnded` drives the rotation.
              onEnded={slot === layer ? advance : undefined}
              onError={() => markFailed(src)}
              aria-hidden
              tabIndex={-1}
              className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
                slot === layer ? "opacity-100" : "opacity-0"
              }`}
            />
          );
        })}

        {/* Legibility scrim; also pointer-transparent so scrolling passes through. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-felt-950 via-felt-950/55 to-felt-950/20"
        />

        {/* Hero copy. Children opt back into pointer events individually. */}
        <div className="pointer-events-none absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 sm:pb-16">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
