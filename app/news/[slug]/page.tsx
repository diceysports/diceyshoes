import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getNewsArticle, getLatestNews } from "@/lib/data/news";
import { NewsCard } from "@/components/NewsCard";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getNewsArticle(params.slug);
  return { title: article ? article.headline : "News" };
}

export default async function NewsArticlePage({ params }: { params: { slug: string } }) {
  const article = await getNewsArticle(params.slug);
  if (!article) notFound();

  const related = (await getLatestNews(4)).filter((a) => a.slug !== article.slug);

  return (
    <article className="mx-auto max-w-[760px] px-5 py-14 md:px-8">
      <div className="mb-4 text-[11px] font-bold uppercase tracking-wide text-accent">
        {article.category}
      </div>
      <h1 className="font-display mb-5 text-[clamp(28px,5vw,44px)] uppercase leading-[1.05]">
        {article.headline}
      </h1>
      <div className="mb-10 flex items-center gap-3 text-xs text-fog">
        <span>
          {new Date(article.publishedAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
        <span>·</span>
        <span>
          Source:{" "}
          <a href={article.sourceUrl} className="underline" target="_blank" rel="noreferrer">
            {article.sourceName}
          </a>
        </span>
      </div>

      <div className="mb-14 flex aspect-video items-center justify-center rounded-2xl border border-line bg-gradient-to-br from-accent-dim to-volt-dim">
        <span className="font-display text-2xl uppercase text-paper/20">{article.sourceName}</span>
      </div>

      <p className="mb-10 text-[15px] leading-relaxed text-paper/85">{article.summary}</p>

      {related.length > 0 && (
        <div className="border-t border-line pt-10">
          <h2 className="font-display mb-6 text-xl uppercase">More From The Sneaker World</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((a) => (
              <NewsCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      )}

      <Link href="/news" className="mt-10 inline-block text-xs font-bold uppercase underline">
        ← Back to News
      </Link>
    </article>
  );
}
