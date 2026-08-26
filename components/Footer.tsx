import Link from "next/link";
import { DSMark } from "./DSMark";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { href: "/new-releases", label: "New Releases" },
      { href: "/sneakers", label: "Sneakers" },
      { href: "/luxury", label: "Luxury" },
      { href: "/men", label: "Men" },
      { href: "/women", label: "Women" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "#", label: "Contact" },
      { href: "#", label: "Shipping" },
      { href: "#", label: "Returns" },
      { href: "#", label: "Size Guide" },
      { href: "#", label: "FAQ" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "#", label: "About Dicey Shoes" },
      { href: "/news", label: "News" },
      { href: "/releases", label: "Release Calendar" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-chrome-line bg-chrome text-white">
      <div className="mx-auto max-w-[1320px] px-5 py-16 md:px-8">
        <div className="mb-12 grid grid-cols-2 gap-10 md:grid-cols-[1.4fr,1fr,1fr,1fr]">
          <div>
            <div className="mb-4">
              <DSMark size={36} />
            </div>
            <p className="max-w-[240px] text-[13px] leading-relaxed text-chrome-fog">
              Premium footwear discovery — sport culture and luxury fashion, in one catalog.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-[11px] uppercase tracking-[0.12em] text-chrome-fog">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[13.5px] text-white/80 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-chrome-line pt-6 text-xs text-chrome-fog">
          <span>© 2026 Dicey Shoes</span>
          <span>Proof of concept — built on the live Dicey Shoes product database</span>
        </div>
      </div>
    </footer>
  );
}
