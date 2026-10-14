"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { Article } from "@/lib/article-types";

export default function ArticleGrid({ articles }: { articles: Article[] }) {
  const [area, setArea] = useState("Todos");
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const areas = ["Todos", ...Array.from(new Set(articles.map((a) => a.area)))];

  useEffect(() => {
    if (window.location.hash === "#search") input.current?.focus();
  }, []);

  const filtered = articles.filter(
    (a) =>
      (area === "Todos" || a.area === area) &&
      (a.title + " " + a.summary).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <div className="filters">
        <div className="filter-buttons">
          {areas.map((a) => (
            <button key={a} className={area === a ? "chip active" : "chip"} onClick={() => setArea(a)}>
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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar uma ideia"
            aria-label="Buscar artigos"
          />
        </label>
      </div>

      <div className="article-grid">
        {filtered.map((a, i) => (
          <article className="article-card" key={a.slug}>
            <Link className={"article-visual visual-" + (i % 3)} href={`/revista/${a.slug}`} aria-label={"Ler " + a.title}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/neural-glass.png" alt="" />
              <span className="visual-label">{a.kicker}</span>
              <span className="visual-no">{String(a.number).padStart(2, "0")}</span>
            </Link>
            <div className="card-meta">
              <span>{a.area.toUpperCase()}</span>
            </div>
            <Link className="title-button" href={`/revista/${a.slug}`}>
              <h3>{a.title}</h3>
            </Link>
            <p>{a.summary}</p>
            <span className="type-label">{a.type}</span>
            <div className="byline">
              <span>{a.author}</span>
              <span>{a.time} de leitura</span>
            </div>
          </article>
        ))}
      </div>

      {!filtered.length && (
        <div className="empty">
          <Search />
          <h3>{articles.length ? "Nenhuma leitura encontrada" : "A primeira edição está sendo preparada"}</h3>
          <p>{articles.length ? "Tente outro termo ou categoria." : "Os artigos publicados pela equipe editorial aparecem aqui."}</p>
          {articles.length > 0 && (
            <button className="outline" onClick={() => { setArea("Todos"); setQuery(""); }}>
              Limpar busca
            </button>
          )}
        </div>
      )}
    </>
  );
}
