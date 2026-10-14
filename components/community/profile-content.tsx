"use client";
import "./comunidade.css";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { FeedArticle, FeedPost } from "@/lib/community-data";
import ThoughtCard from "./thought-card";
import ArticleCard from "./article-card";

type Tab = "tudo" | "artigos" | "pensamentos";

/** Publicações do autor: artigos e pensamentos, com abas. */
export default function ProfileContent({ posts, articles, saved, signedIn, isMine }: { posts: FeedPost[]; articles: FeedArticle[]; saved: string[]; signedIn: boolean; isMine: boolean }) {
  const [tab, setTab] = useState<Tab>(articles.length > 0 ? "tudo" : "pensamentos");
  const savedSet = useMemo(() => new Set(saved), [saved]);

  const items = useMemo(() => {
    const out: ({ k: "p"; date: string; post: FeedPost } | { k: "a"; date: string; article: FeedArticle })[] = [];
    if (tab !== "pensamentos") articles.forEach((a) => out.push({ k: "a", date: a.publishedAt, article: a }));
    if (tab !== "artigos") posts.forEach((p) => out.push({ k: "p", date: p.createdAt, post: p }));
    return out.sort((x, y) => Date.parse(y.date) - Date.parse(x.date));
  }, [tab, posts, articles]);

  const total = posts.length + articles.length;
  return (
    <section aria-label="Publicações">
      <div className="cm-subbar">
        <nav className="cm-tabs" role="tablist" aria-label="Tipo de publicação">
          {([["tudo", "Tudo", total], ["artigos", "Artigos", articles.length], ["pensamentos", "Pensamentos", posts.length]] as [Tab, string, number][]).map(([k, l, n]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
              {l} <small className="cm-count">{n}</small>
            </button>
          ))}
        </nav>
      </div>

      {items.length === 0 ? (
        <div className="cm-empty">
          <h3>
            {isMine
              ? tab === "artigos"
                ? "Você ainda não tem artigos publicados."
                : "Você ainda não publicou nada."
              : tab === "artigos"
                ? "Nenhum artigo publicado ainda."
                : "Ainda não há publicações."}
          </h3>
          <p>
            {isMine
              ? tab === "artigos"
                ? "Escreva um artigo completo e envie para a revisão da equipe."
                : "Escreva seu primeiro texto e ele aparece aqui."
              : "Volte em breve ou siga para ser avisado."}
          </p>
          {isMine && (
            <div className="cm-hero-actions">
              <Link className="outline" href="/escrever">Escrever artigo</Link>
              <Link className="primary" href="/escrever/pensamento">Escrever pensamento</Link>
            </div>
          )}
        </div>
      ) : (
        <div className="cm-feed">
          {items.map((it) =>
            it.k === "a" ? (
              <ArticleCard key={"a" + it.article.slug} article={it.article} showAuthor={false} />
            ) : (
              <ThoughtCard key={"p" + it.post.id} post={it.post} saved={savedSet.has(it.post.id)} signedIn={signedIn} showAuthor={false} />
            ),
          )}
        </div>
      )}
    </section>
  );
}
