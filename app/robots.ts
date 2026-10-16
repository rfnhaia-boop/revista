import type { MetadataRoute } from "next";
import { privateReviewMode } from "@/lib/runtime-mode";

export default function robots(): MetadataRoute.Robots {
  if (privateReviewMode()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  const base = (process.env.APP_ORIGIN || "").replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/entrar", "/minha-new", "/gestao", "/editorial", "/pesquisador"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
