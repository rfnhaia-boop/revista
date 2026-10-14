"use client";
import Link from "next/link";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Article } from "@/lib/article-types";
import Markdown from "@/components/editor/markdown";

export default function ArticleView({ article }: { article: Article }) {
  return (
    <article className="editorial-article-page">
      <Link className="article-back" href="/">
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
          </div>
        </div>
        <div className="editorial-article-art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/neural-glass.png" alt="Arte abstrata em vidro violeta" />
          <span>NEW · {String(article.number).padStart(2, "0")}</span>
        </div>
      </header>
      <div className="editorial-article-shell">
        <Tabs defaultValue="public">
          <TabsList className="view-tabs article-tabs">
            <TabsTrigger value="public">Leitura pública</TabsTrigger>
            <TabsTrigger value="scientific">Registro acadêmico</TabsTrigger>
          </TabsList>
          <TabsContent value="public">
            <div className="reading article-reading">
              <p className="lead">{article.summary}</p>
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
              <p>{article.references || "Não informadas."}</p>
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
            onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success("Link copiado."))}
          >
            Copiar link da matéria
          </button>
        </aside>
      </div>
    </article>
  );
}
