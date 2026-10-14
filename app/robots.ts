import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.APP_ORIGIN || "").replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/entrar", "/minha-new", "/gestao", "/editorial", "/pesquisador"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
