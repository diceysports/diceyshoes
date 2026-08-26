import { Die } from "./Die";
import type { Product } from "@/lib/products";

/**
 * Product art is drawn rather than photographed: a gradient panel, a stylized
 * product silhouette, and the product's die face as a watermark.
 */
export function ProductArt({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const [from, to] = product.gradient;
  const gradientId = `product-gradient-${product.slug}`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ backgroundImage: `linear-gradient(140deg, ${from}, ${to})` }}
    >
      <div className="absolute -right-6 -top-6 w-28 opacity-20 sm:w-32">
        <Die face={product.face} faceColor="#ffffff" pipColor={to} />
      </div>

      <svg
        viewBox="0 0 200 110"
        className="relative h-full w-full"
        role="img"
        aria-label={`${product.name} illustration`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.65" />
          </linearGradient>
        </defs>

        {/* upper */}
        <path
          d="M18 74 L22 40 Q24 28 38 27 L60 26 Q69 26 75 32 L102 54 Q110 60 122 62 L166 66 Q182 68 184 74 Z"
          fill={`url(#${gradientId})`}
        />
        {/* collar */}
        <path
          d="M22 40 Q34 34 46 36 L44 27 Q28 26 22 34 Z"
          fill="#ffffff"
          opacity="0.55"
        />
        {/* laces */}
        <g stroke={to} strokeWidth="2.5" strokeLinecap="round" opacity="0.55">
          <line x1="52" y1="36" x2="66" y2="42" />
          <line x1="60" y1="42" x2="74" y2="48" />
          <line x1="68" y1="48" x2="82" y2="54" />
        </g>
        {/* side stripe */}
        <path
          d="M92 72 Q104 52 128 50 L134 58 Q112 62 104 74 Z"
          fill={to}
          opacity="0.45"
        />
        {/* midsole */}
        <path
          d="M14 74 L186 74 Q192 74 192 80 L192 84 Q192 92 182 92 L26 92 Q14 92 12 84 L12 80 Q12 74 14 74 Z"
          fill="#ffffff"
          opacity="0.9"
        />
        {/* outsole */}
        <path
          d="M13 86 L191 86 Q190 93 181 93 L26 93 Q15 93 13 86 Z"
          fill={to}
          opacity="0.85"
        />
      </svg>
    </div>
  );
}
