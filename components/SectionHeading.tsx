import Link from "next/link";

export function SectionHeading({
  kicker,
  title,
  href,
  linkLabel,
}: {
  kicker: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
      <div>
        <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-fog">{kicker}</span>
        <h2 className="font-display text-[clamp(30px,4vw,44px)] uppercase leading-none">{title}</h2>
      </div>
      {href && linkLabel && (
        <Link href={href} className="whitespace-nowrap border-b border-fog pb-0.5 text-xs font-bold uppercase tracking-wide hover:border-paper">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
