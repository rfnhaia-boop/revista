import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { FeedArticle } from "@/lib/community-data";
import { Avatar, shortDate } from "./thought-card";

/** Cartão de artigo: maior que o de pensamento, com selo "Artigo" e chamada para leitura. */
export default function ArticleCard({ article, showAuthor = true }: { article: FeedArticle; showAuthor?: boolean }) {
  return (
    <article className="cm-card cm-article">
      <div className="cm-card-top">
        <span className="cm-badge">Artigo</span>
        <span className="cm-date">{shortDate(article.publishedAt)}</span>
      </div>
      <div className="cm-kicker">{article.type} · {article.area}</div>
      <h3>
        <Link href={`/revista/${article.slug}`} className="cm-stretch">{article.title}</Link>
      </h3>
      <p className="cm-excerpt cm-excerpt-lg">{article.summary}</p>
      <div className="cm-article-foot">
        {showAuthor ? (
          article.authorSlug ? (
            <Link href={`/pessoas/${article.authorSlug}`} className="cm-author">
              <Avatar name={article.authorName} size={32} />
              <span>{article.authorName}</span>
            </Link>
          ) : (
            <span className="cm-author static">
              <Avatar name={article.authorName} size={32} />
              <span>{article.authorName}</span>
            </span>
          )
        ) : (
          <span />
        )}
        <span className="cm-read">
          <Clock size={14} /> {article.minutes} min <ArrowRight size={15} />
        </span>
      </div>
    </article>
  );
}
