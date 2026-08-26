/**
 * Generated fallback for any product whose only images are
 * REFERENCE_ONLY / not storefront_approved (currently: 100% of the
 * master catalog). Intentionally NOT a photo and NOT trying to look like
 * one — an abstract shoe silhouette + brand wordmark + style code, styled
 * as a deliberate piece of the Dicey Shoes visual system. The moment
 * lib/utils/media.ts finds a storefront-safe image for a product, this
 * component stops being rendered for it automatically (see ProductCard /
 * PDP gallery logic) — no other change needed.
 */
export function ProductPlaceholder({
  brand,
  model,
  styleCode,
  size = "md",
}: {
  brand: string;
  model?: string | null;
  styleCode?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const glyphSize = size === "lg" ? 72 : size === "sm" ? 34 : 52;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#111214]">
      <svg
        width={glyphSize}
        height={glyphSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth={1.2}
        className="opacity-60"
        aria-hidden="true"
      >
        <path d="M2 15c0-1 1-2 2-2 1.5 0 2 1 3.5 1s2-1 3.5-1 2 1 3.5 1 2.5-2 4-2c1.5 0 2.5 1.5 3.5 2.5V18c0 1-1 2-2 2H4c-1 0-2-1-2-2v-3Z" />
        <path d="M2 14 6 6c.5-1 1.5-1.5 2.5-1l9 3.5" />
      </svg>
      <div className="text-center">
        <div className="font-display text-sm uppercase tracking-wider text-white/50">{brand}</div>
        {model && size !== "sm" && (
          <div className="mt-0.5 text-[11px] text-white/40">{model}</div>
        )}
      </div>
      {styleCode && size === "lg" && (
        <div className="font-mono text-[11px] text-white/40">[{styleCode}]</div>
      )}
    </div>
  );
}
