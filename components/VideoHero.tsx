"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DSMark } from "./DSMark";

/**
 * Full-viewport autoplay sneaker montage hero. Two <video> layers
 * crossfade between shuffled clips; only the active clip + the one
 * preloading behind it are ever attached to the DOM at once.
 */

type Clip = {
  id: string;
  mobile: string;
  desktop: string;
  objectPosition?: string;
};

const CLIPS: Clip[] = [
  { id: "lv-skate", mobile: "/videos/hero/lv-skate-mobile.mp4", desktop: "/videos/hero/lv-skate-desktop.mp4" },
  { id: "air-force", mobile: "/videos/hero/air-force-mobile.mp4", desktop: "/videos/hero/air-force-desktop.mp4" },
  {
    id: "jordan-5",
    mobile: "/videos/hero/jordan-5-mobile.mp4",
    desktop: "/videos/hero/jordan-5-desktop.mp4",
    objectPosition: "center 35%",
  },
  { id: "jordan-12", mobile: "/videos/hero/jordan-12-mobile.mp4", desktop: "/videos/hero/jordan-12-desktop.mp4" },
  { id: "balenciaga", mobile: "/videos/hero/balenciaga-mobile.mp4", desktop: "/videos/hero/balenciaga-desktop.mp4" },
];

const FADE_MS = 900;

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

export function VideoHero() {
  // Randomized client-side only, after mount, so the server-rendered
  // markup is deterministic and there's no hydration mismatch.
  const [clips, setClips] = useState<Clip[] | null>(null);
  const [autoplayFailed, setAutoplayFailed] = useState(false);

  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  const refForLayer = (layer: 0 | 1) => (layer === 0 ? aRef : bRef);
  const activeLayerRef = useRef<0 | 1>(0);
  const clipIndexRef = useRef(0);
  const switchingRef = useRef(false);

  useEffect(() => {
    setClips(shuffled(CLIPS));
  }, []);

  useEffect(() => {
    if (!clips || clips.length === 0) return;
    const a = aRef.current;
    const b = bRef.current;
    if (!a || !b) return;
    const clipCount = clips.length;
    const clipAt = (index: number): Clip => clips[((index % clipCount) + clipCount) % clipCount]!;

    let cancelled = false;

    const isMobile = () => window.matchMedia("(max-width: 767px)").matches;
    const srcFor = (clip: Clip) => (isMobile() ? clip.mobile : clip.desktop);

    const loadInto = (video: HTMLVideoElement, clip: Clip) => {
      video.src = srcFor(clip);
      video.style.objectPosition = clip.objectPosition ?? "center";
      video.load();
    };

    const attemptPlay = (video: HTMLVideoElement) => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          if (!cancelled) setAutoplayFailed(true);
        });
      }
    };

    const crossfade = () => {
      if (switchingRef.current || clipCount < 2) return;
      switchingRef.current = true;

      const nextLayer: 0 | 1 = activeLayerRef.current === 0 ? 1 : 0;
      const nextClipIndex = clipIndexRef.current + 1;
      const nextVideo = refForLayer(nextLayer).current;
      const currentVideo = refForLayer(activeLayerRef.current).current;
      if (!nextVideo || !currentVideo) {
        switchingRef.current = false;
        return;
      }

      nextVideo.currentTime = 0;
      attemptPlay(nextVideo);
      nextVideo.style.opacity = "1";
      currentVideo.style.opacity = "0";

      activeLayerRef.current = nextLayer;
      clipIndexRef.current = nextClipIndex;

      window.setTimeout(() => {
        if (cancelled) return;
        currentVideo.pause();
        loadInto(currentVideo, clipAt(nextClipIndex + 1));
        switchingRef.current = false;
      }, FADE_MS);
    };

    const handleTimeUpdate = (event: Event) => {
      const video = event.currentTarget as HTMLVideoElement;
      if (video !== refForLayer(activeLayerRef.current).current) return;
      if (switchingRef.current || !Number.isFinite(video.duration)) return;
      const remaining = video.duration - video.currentTime;
      if (remaining <= FADE_MS / 1000) {
        crossfade();
      }
    };

    // First clip plays immediately; second preloads paused behind it.
    a.style.opacity = "1";
    b.style.opacity = "0";
    loadInto(a, clipAt(0));
    attemptPlay(a);
    if (clipCount > 1) {
      loadInto(b, clipAt(1));
    }

    a.addEventListener("timeupdate", handleTimeUpdate);
    b.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      cancelled = true;
      a.removeEventListener("timeupdate", handleTimeUpdate);
      b.removeEventListener("timeupdate", handleTimeUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clips]);

  return (
    <section className="relative h-[100svh] min-h-[520px] w-full overflow-hidden bg-black text-white">
      {clips && !autoplayFailed && (
        <>
          <video
            ref={aRef}
            muted
            autoPlay
            playsInline
            loop={false}
            preload="auto"
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity ease-in-out"
            style={{ transitionDuration: `${FADE_MS}ms` }}
          />
          <video
            ref={bRef}
            muted
            playsInline
            loop={false}
            preload="auto"
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity ease-in-out"
            style={{ transitionDuration: `${FADE_MS}ms` }}
          />
        </>
      )}

      {/* Subtle scrim so overlay text stays readable regardless of which clip is active */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/45" />

      {/* Minimal branding overlay */}
      <div className="pointer-events-none relative flex h-full w-full flex-col items-center justify-center px-6 text-center">
        <div className="opacity-90">
          <DSMark size={44} />
        </div>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/70">
          Dicey Shoes
        </p>
      </div>

      {/* Scroll cue + CTAs — pointer-events re-enabled here only */}
      <div className="absolute inset-x-0 bottom-9 flex flex-col items-center gap-6 px-5">
        <div className="flex flex-wrap justify-center gap-3.5">
          <Link
            href="/new-releases"
            className="rounded-full bg-volt px-7 py-3.5 text-[13px] font-bold uppercase tracking-wide text-chrome transition-transform hover:scale-[1.03]"
          >
            Shop New Releases
          </Link>
          <Link
            href="/shop"
            className="rounded-full border border-white/30 px-7 py-3.5 text-[13px] font-bold uppercase tracking-wide text-white transition-colors hover:border-white"
          >
            Explore Catalog
          </Link>
        </div>
        <span className="h-8 w-[1px] animate-pulse bg-white/40" aria-hidden />
      </div>
    </section>
  );
}
