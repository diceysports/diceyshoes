import Link from "next/link";
import type { NewsArticle } from "@/lib/types";

export function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-surface transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-accent-dim to-transparent">
        <span className="font-display text-3xl uppercase text-paper/15">{article.sourceName}</span>
      </div>
      <div className="p-6">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-wide text-accent">
          {article.category}
        </div>
        <h3 className="mb-2.5 text-[17px] font-bold leading-snug">{article.headline}</h3>
        <p className="mb-4 text-[13px] leading-relaxed text-fog">{article.summary}</p>
        <div className="flex items-center justify-between text-xs text-fog">
          <span>{article.sourceName}</span>
          <span className="font-semibold uppercase tracking-wide text-paper/80 group-hover:text-accent">
            Read Story →
          </span>
        </div>
      </div>
    </Link>
  );
}
