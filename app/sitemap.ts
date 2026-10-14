import type { MetadataRoute } from "next";
import { listPublishedArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.APP_ORIGIN || "").replace(/\/$/, "");
  const articles = await listPublishedArticles();
  const fixed = ["", "/selos", "/protocolo", "/explorar", "/pessoas", "/livros", "/research", "/observatorio", "/projetos"].map((p) => ({
    url: `${base}${p}` || base + "/",
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.5,
  }));
  return [
    ...fixed,
    ...articles.map((a) => ({
      url: `${base}/revista/${a.slug}`,
      lastModified: a.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
