import type { Metadata } from "next";
import ArticleView from "@/components/site/article-view";
import { ArticleProgressView, NotAvailableView } from "@/components/site/unavailable";
import { getPublishedArticle } from "@/lib/articles";
import { getCurrentUser } from "@/lib/auth";
import { database } from "@/lib/storage";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) {
    const user = await getCurrentUser();
    const mine = user
      ? await database()
          .prepare("SELECT id,title,status,review_note AS reviewNote FROM articles WHERE slug=? AND author_id=?")
          .bind(slug, user.userId)
          .first<{ id: string; title: string; status: string; reviewNote: string | null }>()
      : null;
    if (mine) return <ArticleProgressView article={{ ...mine, reviewNote: mine.reviewNote ?? "" }} />;
    return <NotAvailableView signedIn={!!user} />;
  }
  const base = process.env.APP_ORIGIN || "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    articleSection: article.area,
    author: { "@type": "Organization", name: article.author },
    publisher: { "@type": "Organization", name: "NEW Company" },
    datePublished: article.publishedAt,
    inLanguage: "pt-BR",
    mainEntityOfPage: `${base}/revista/${article.slug}`,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }} />
      <ArticleView article={article} />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await getPublishedArticle(slug);
  if (!a) return { title: "Matéria indisponível · Revista NEW", robots: { index: false } };
  return {
    title: `${a.title} · Revista NEW`,
    description: a.summary,
    alternates: { canonical: `/revista/${a.slug}` },
    openGraph: {
      type: "article", title: a.title, description: a.summary, publishedTime: a.publishedAt, section: a.area,
      locale: "pt_BR", siteName: "Revista NEW", url: `/revista/${a.slug}`,
      images: [{ url: "/neural-glass.png", alt: "Arte abstrata em vidro violeta" }],
    },
    twitter: { card: "summary_large_image", title: a.title, description: a.summary, images: ["/neural-glass.png"] },
  };
}
