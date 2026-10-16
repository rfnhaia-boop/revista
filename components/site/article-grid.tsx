"use client";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { Article } from "@/lib/article-types";
import { matchesArticle } from "@/lib/article-search";

export default function ArticleGrid({ articles }: { articles: Article[] }) {
  const [area, setArea] = useState("Todos");
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const areas = ["Todos", ...Array.from(new Set(articles.map((a) => a.area)))];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chosen = params.get("area");
    setArea(chosen && areas.includes(chosen) ? chosen : "Todos");
    setQuery(params.get("q")?.slice(0, 200) ?? "");
    if (window.location.hash === "#search") input.current?.focus();
    const focusSearch = () => { if (window.location.hash === "#search") input.current?.focus(); };
    window.addEventListener("hashchange", focusSearch);
    return () => window.removeEventListener("hashchange", focusSearch);
    // The available areas are fixed for this page's article collection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function filter(nextArea: string, nextQuery: string) {
    setArea(nextArea);
    setQuery(nextQuery);
    const url = new URL(window.location.href);
    if (nextArea === "Todos") url.searchParams.delete("area"); else url.searchParams.set("area", nextArea);
    if (nextQuery) url.searchParams.set("q", nextQuery); else url.searchParams.delete("q");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }

  const filtered = articles.filter((a) => matchesArticle(a, area, query));
  const cover = (slug: string) => slug === "a-segunda-maca"
    ? "https://revista-new-validacao.dricapillica.chatgpt.site/second-apple-hero.png"
    : "/neural-glass.png";

  return (
    <>
      <div className="filters">
        <div className="filter-buttons" role="group" aria-label="Filtrar matérias por área">
          {areas.map((a) => (
            <button key={a} aria-pressed={area === a} className={area === a ? "chip active" : "chip"} onClick={() => filter(a, query)}>
              {a}
            </button>
          ))}
        </div>
        <label className="search">
          <Search size={16} />
          <input
            id="search"
            ref={input}
            value={query}
            onChange={(e) => filter(area, e.target.value)}
            maxLength={200}
            placeholder="Buscar uma ideia"
            aria-label="Buscar artigos"
          />
        </label>
      </div>
      <p className="article-result-count" role="status">{filtered.length} {filtered.length === 1 ? "matéria disponível" : "matérias disponíveis"}</p>

      <div className="article-grid">
        {filtered.map((a, i) => (
          <a
            className="article-card"
            href={`/revista/${a.slug}`}
            aria-label={"Ler " + a.title}
            key={a.slug}
          >
            <div className={"article-visual visual-" + (i % 3)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover(a.slug)} alt="" />
              <span className="visual-label">{a.kicker}</span>
              <span className="visual-no">{String(a.number).padStart(2, "0")}</span>
            </div>
            <div className="card-meta">
              <span>{a.area.toUpperCase()}</span>
            </div>
            <div className="title-button">
              <h3>{a.title}</h3>
            </div>
            <p>{a.summary}</p>
            <span className="type-label">{a.type}</span>
            <div className="byline">
              <span>{a.author}</span>
              <span>{a.time} de leitura</span>
            </div>
          </a>
        ))}
      </div>

      {!filtered.length && (
        <div className="empty">
          <Search />
          <h3>{articles.length ? "Nenhuma leitura encontrada" : "A primeira edição está sendo preparada"}</h3>
          <p>{articles.length ? "Tente outro termo ou categoria." : "Os artigos publicados pela equipe editorial aparecem aqui."}</p>
          {articles.length > 0 && (
            <button className="outline" onClick={() => filter("Todos", "")}>
              Limpar busca
            </button>
          )}
        </div>
      )}
    </>
  );
}
