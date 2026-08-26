/**
 * Product imagery from the catalog.
 *
 * Uses a plain <img> rather than next/image: the catalog draws from many
 * retailer CDNs (goat.com, shopify, flightclub…), and next/image would need
 * every one of those hosts allow-listed in next.config before it would render.
 * Images are contained rather than cropped so silhouettes stay intact.
 */
export function ProductArt({
  src,
  alt,
  className = "",
  sizes = "(min-width: 1024px) 33vw, 100vw",
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-felt-800 ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-bone-dim">
          No image
        </div>
      )}
    </div>
  );
}
