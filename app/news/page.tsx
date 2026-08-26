import type { Metadata } from "next";
import { getLatestNews } from "@/lib/data/news";
import { NewsCard } from "@/components/NewsCard";

export const metadata: Metadata = { title: "News" };

export default async function NewsPage() {
  const articles = await getLatestNews(12);

  return (
    <section className="mx-auto max-w-[1320px] px-5 py-14 md:px-8">
      <h1 className="font-display mb-3 text-[clamp(32px,5vw,48px)] uppercase leading-none">
        From The Sneaker World
      </h1>
      <p className="mb-10 max-w-2xl text-sm leading-relaxed text-fog">
        Verified stories with clear source attribution — never fabricated headlines.
      </p>

      {articles.length === 0 ? (
        <div className="rounded border border-dashed border-line px-10 py-16 text-center">
          <h3 className="font-display mb-3 text-2xl uppercase">No Live Source Connected Yet</h3>
          <p className="mx-auto max-w-md text-sm text-fog">
            This proof of concept doesn&apos;t fabricate news. The news adapter
            (lib/data/news.ts) is ready to plug into a real source — once connected, verified
            stories with source attribution will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <NewsCard key={a.slug} article={a} />
          ))}
        </div>
      )}
    </section>
  );
}
