"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductMedia } from "@/lib/types";
import { visibleImages, visibleVideos } from "@/lib/utils/media";
import { ProductPlaceholder } from "./ProductPlaceholder";
import clsx from "clsx";

export function ProductGallery({
  media,
  brand,
  model,
  styleCode,
}: {
  media: ProductMedia[];
  brand: string;
  model: string | null;
  styleCode: string | null;
}) {
  const images = visibleImages(media);
  const videos = visibleVideos(media);
  const items = [...images, ...videos];

  const [activeIdx, setActiveIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  if (items.length === 0) {
    return (
      <div className="aspect-square overflow-hidden rounded-xl border border-line bg-surface">
        <ProductPlaceholder brand={brand} model={model} styleCode={styleCode} size="lg" />
      </div>
    );
  }

  const active = items[activeIdx] ?? items[0];
  if (!active) return null; // unreachable (items.length > 0 above) but satisfies strict indexing
  const activeIsVideo = active.mediaType === "VIDEO";

  return (
    <div>
      <button
        onClick={() => setFullscreen(true)}
        className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-line bg-surface"
        aria-label="View fullscreen"
      >
        {activeIsVideo ? (
          <video
            src={active.url}
            className="h-full w-full object-cover"
            controls
            playsInline
            preload="metadata"
          />
        ) : (
          <Image
            src={active.url}
            alt={`${brand} ${model ?? ""}`}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
      </button>

      {items.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {items.map((item, i) => (
            <button
              key={item.mediaId}
              onClick={() => setActiveIdx(i)}
              className={clsx(
                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-surface",
                i === activeIdx ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              {item.mediaType === "VIDEO" ? (
                <div className="flex h-full w-full items-center justify-center bg-ink/5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              ) : (
                <Image src={item.url} alt="" fill unoptimized className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {fullscreen && !activeIsVideo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-6"
          onClick={() => setFullscreen(false)}
        >
          <button
            className="absolute right-6 top-6 text-white"
            onClick={() => setFullscreen(false)}
            aria-label="Close fullscreen"
          >
            ✕
          </button>
          <div className="relative h-full max-h-[85vh] w-full max-w-3xl">
            <Image src={active.url} alt="" fill unoptimized className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
