import Link from "next/link";
import { BookOpen, ChevronRight, Feather, FlaskConical, Heart, Plus, ShieldCheck } from "lucide-react";
import ArticleGrid from "@/components/site/article-grid";
import { listPublishedArticles } from "@/lib/articles";
import { moneyEnabled } from "@/lib/features";

export default async function Home() {
  const articles = await listPublishedArticles();
  const money = moneyEnabled();
  return (
    <>
      <section className="hero">
        <div className="hero-art" />
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="line" /> CONHECIMENTO EM MOVIMENTO
          </div>
          <h1>
            Ciência começa
            <br />
            com uma <em>pergunta.</em>
          </h1>
          <p>
            Ideias que merecem ser investigadas.
            <br />
            Pessoas que merecem a oportunidade de investigar.
          </p>
          <div className="hero-buttons">
            <Link className="primary" href="/escrever">
              <Plus size={17} /> Escrever um artigo
            </Link>
            <Link className="textbutton" href="/research">
              Propor uma pergunta <ChevronRight size={16} />
            </Link>
          </div>
          <div className="hero-meta">
            <span>01 / EDIÇÃO INAUGURAL</span>
            <span>Uma iniciativa NEW Company</span>
          </div>
        </div>
        <div className="hero-note glass">
          <FlaskConical size={21} />
          <div>
            <span>DA CURIOSIDADE À DESCOBERTA</span>
            <p>
              A comunidade pergunta.
              <br />A ciência investiga.
            </p>
          </div>
        </div>
      </section>

      <section className="new-company-bridge">
        <img src="https://revista-new-validacao.dricapillica.chatgpt.site/new-company-light.png" alt="" aria-hidden="true" />
        <div>
          <div className="eyebrow">UMA PUBLICAÇÃO NEW COMPANY</div>
          <h2>Ideias que nascem na NEW.<br /><em>Conhecimento que encontra pessoas.</em></h2>
          <p>A Revista é a frente editorial da NEW Company: o lugar onde pesquisas, ensaios e perguntas ganham contexto, autoria e continuidade.</p>
          <a className="outline" href="https://new-company.dricapillica.chatgpt.site/">Conhecer a NEW Company →</a>
        </div>
      </section>

      <section className="editorial-layout">
        <div>
          <div className="section-heading">
            <div>
              <div className="eyebrow">EXPLORE A REVISTA</div>
              <h2>Ideias em perspectiva</h2>
            </div>
            <span className="muted">Leitura aberta</span>
          </div>
          <p className="editorial-policy-note">
            Conteúdo editorial NEW: o formato, o estágio e a avaliação de cada obra são informados na leitura. Revisão
            editorial não equivale automaticamente a revisão por pares.
          </p>
          <ArticleGrid articles={articles} />
        </div>

        <aside className="support glass">
          <div className="eyebrow">COMUNIDADE NEW</div>
          <h2>
            Sua ideia pode
            <br />
            começar <em>pequena.</em>
          </h2>
          <p>Uma anotação, um ensaio ou uma pergunta. Escreva no seu Caderno e deixe a comunidade encontrar.</p>
          <div className="support-icon">
            <Feather size={32} strokeWidth={1} />
          </div>
          <Link className="primary full" href="/caderno?novo=1">
            Escrever no meu Caderno
          </Link>
          <Link className="outline full" href="/research" style={{ marginTop: 10 }}>
            Ver perguntas da comunidade
          </Link>
          {money && (
            <p className="fine">
              <Heart size={12} /> <Link href="/apoie">Apoie a construção da NEW</Link>
            </p>
          )}
        </aside>
      </section>

      <section className="home-extension glass">
        <div>
          <div className="eyebrow">CONSTRUA COM A NEW</div>
          <h2>Livros, pesquisas e novos começos.</h2>
          <p>
            Uma biblioteca para ideias de maior fôlego e um espaço para apresentar projetos de conhecimento.
          </p>
        </div>
        <div className="actions">
          <Link className="outline" href="/livros">
            <BookOpen size={17} /> Conhecer os livros
          </Link>
          <Link className="primary" href="/projetos">
            Ver projetos
          </Link>
        </div>
      </section>

      <section className="principle">
        <span>O PRINCÍPIO NEW</span>
        <h2>
          Financiamos perguntas.
          <br />
          <em>Nunca compramos respostas.</em>
        </h2>
        <Link className="outline" href="/protocolo">
          <ShieldCheck size={17} /> Conheça o protocolo
        </Link>
      </section>
    </>
  );
}
