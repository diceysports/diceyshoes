import clsx from "clsx";

/**
 * The Dicey Shoes mark. Deliberately NOT a serif/luxury-watch treatment
 * (avoids reading as DiceyWatches): a slanted, condensed, forward-leaning
 * "DS" with a speed-streak accent underneath, evoking motion rather than
 * heritage/timepiece cues. Works standalone (header/footer chip) or with
 * the wordmark alongside it.
 */
export function DSMark({
  size = 36,
  withWordmark = false,
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        role="img"
        aria-label="Dicey Shoes"
      >
        <rect width="40" height="40" rx="10" fill="#FAFAF8" />
        <g transform="skewX(-8)">
          <text
            x="8.5"
            y="27.5"
            fontFamily="var(--font-display), sans-serif"
            fontWeight={800}
            fontSize="19"
            fill="#0B0C0E"
            letterSpacing="-1"
          >
            DS
          </text>
        </g>
        {/* speed streaks — the "kinetic" signature element */}
        <rect x="7" y="31.5" width="14" height="2" rx="1" fill="#C8FF3D" />
        <rect x="23" y="31.5" width="8" height="2" rx="1" fill="#2F5CFF" opacity="0.9" />
      </svg>
      {withWordmark && (
        <span className="font-display text-[15px] uppercase tracking-[0.08em]">Dicey Shoes</span>
      )}
    </span>
  );
}
