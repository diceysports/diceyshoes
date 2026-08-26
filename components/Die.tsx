const PIP_LAYOUT: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [30, 30],
    [70, 70],
  ],
  3: [
    [28, 28],
    [50, 50],
    [72, 72],
  ],
  4: [
    [30, 30],
    [70, 30],
    [30, 70],
    [70, 70],
  ],
  5: [
    [30, 30],
    [70, 30],
    [50, 50],
    [30, 70],
    [70, 70],
  ],
  6: [
    [30, 26],
    [70, 26],
    [30, 50],
    [70, 50],
    [30, 74],
    [70, 74],
  ],
};

export function Die({
  face,
  className = "",
  pipColor = "#0a1b14",
  faceColor = "#f3efe4",
}: {
  face: number;
  className?: string;
  pipColor?: string;
  faceColor?: string;
}) {
  const pips = PIP_LAYOUT[face] ?? PIP_LAYOUT[1];

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={`Die showing ${face}`}
    >
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="20"
        fill={faceColor}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="2"
      />
      <rect
        x="10"
        y="10"
        width="80"
        height="42"
        rx="14"
        fill="rgba(255,255,255,0.35)"
      />
      {pips.map(([cx, cy], index) => (
        <circle key={index} cx={cx} cy={cy} r="8.5" fill={pipColor} />
      ))}
    </svg>
  );
}
