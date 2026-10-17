"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Article } from "@/lib/article-types";
import Markdown from "@/components/editor/markdown";
import { ArticleAudio, ArticleFeedback } from "@/components/site/article-extras";

export default function ArticleView({ article, related = [] }: { article: Article; related?: Article[] }) {
  const heroImage = article.slug === "a-segunda-maca"
    ? "https://revista-new-validacao.dricapillica.chatgpt.site/second-apple-hero.png"
    : "/neural-glass.png";
  const [manualLink, setManualLink] = useState("");
  async function copyLink() {
    const url = `${window.location.origin}/revista/${article.slug}`;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      setManualLink("");
      toast.success("Link copiado.");
    } catch {
      setManualLink(url);
      toast.info("Selecione e copie o endereço abaixo.");
    }
  }
  return (
    <article className="editorial-article-page">
      <Link className="article-back" href="/#search">
        ← Voltar para a Revista
      </Link>
      <header className="editorial-article-header">
        <div>
          <div className="eyebrow">{article.area.toUpperCase()} · EDIÇÃO ZERO</div>
          <h1>{article.title}</h1>
          <p className="article-deck">{article.summary}</p>
          <div className="article-byline">
            <span>{article.author}</span>
            <span>{article.type}</span>
            <span>{article.time} de leitura</span>
            {article.publishedAt && <time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</time>}
          </div>
        </div>
        <div className="editorial-article-art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt={article.slug === "a-segunda-maca" ? "Maçã de vidro violeta, símbolo do ensaio" : "Arte abstrata em vidro violeta"} />
          <span>NEW · {String(article.number).padStart(2, "0")}</span>
        </div>
      </header>
      <ArticleAudio slug={article.slug} title={article.title} />
      <div className="editorial-article-shell">
        <Tabs defaultValue="public">
          <TabsList className="view-tabs article-tabs" aria-label="Modo de leitura da matéria">
            <TabsTrigger value="public">Leitura pública</TabsTrigger>
            <TabsTrigger value="scientific">Registro acadêmico</TabsTrigger>
          </TabsList>
          <TabsContent value="public">
            <div className="reading article-reading">
              <Markdown>{article.body}</Markdown>
              {article.pullquote && <blockquote>{article.pullquote}</blockquote>}
            </div>
          </TabsContent>
          <TabsContent value="scientific">
            <div className="reading article-reading">
              <h3>Estado do trabalho</h3>
              <p>
                {article.type}. {article.statusNote}
              </p>
              <h3>Referências e manuscrito</h3>
              <Markdown>{article.references || "Não informadas."}</Markdown>
              <h3>Versão</h3>
              <p>{article.versionNote || "Primeira publicação."}</p>
            </div>
          </TabsContent>
        </Tabs>
        <aside className="article-side glass">
          <span>TRANSPARÊNCIA EDITORIAL</span>
          <p>O estágio, a autoria e a avaliação desta matéria são apresentados sem transformar pesquisa em promessa.</p>
          <button
            className="outline"
            onClick={() => void copyLink()}
          >
            Copiar link da matéria
          </button>
          {manualLink && <label className="article-link-field">Endereço da matéria<input readOnly value={manualLink} onFocus={(event) => event.currentTarget.select()} /></label>}
        </aside>
      </div>
      <ArticleFeedback slug={article.slug} title={article.title} />
      <nav className="article-continue" aria-label="Continuar a leitura">
        <div className="section-heading"><h2>Continue pela Revista</h2><Link className="textbutton" href="/#search">Todas as matérias →</Link></div>
        <div className="article-related-grid">{related.map((a) => <Link className="glass article-related" href={`/revista/${a.slug}`} key={a.slug}>
          <span className="eyebrow">{a.area}</span><h3>{a.title}</h3><span>{a.time} de leitura →</span>
        </Link>)}</div>
      </nav>
    </article>
  );
}
