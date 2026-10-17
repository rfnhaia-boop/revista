import { BookOpen, Plus } from "lucide-react";
import PageHead from "@/components/site/page-head";
import { OpenFormButton, SubmissionsList } from "@/components/site/submissions";
import BookClub from "@/components/site/book-club";

export const metadata = {
  title: "Livros · Revista NEW",
  description: "Obras, ensaios e pesquisas de maior fôlego também têm espaço na NEW.",
};

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="BIBLIOTECA NEW"
        title="Há ideias que precisam de um livro."
        text="Obras, ensaios e pesquisas de maior fôlego também têm espaço na NEW."
        action={
          <OpenFormButton kind="book" className="primary">
            <Plus size={17} /> Submeter livro
          </OpenFormButton>
        }
      />
      <BookClub />
      <div className="book-intro glass">
        <div className="book-typography">
          <span>NEW · LIVROS</span>
          <h2>
            Conhecimento
            <br />
            com espaço
            <br />
            para <em>ir além.</em>
          </h2>
          <div>OBRAS · PESQUISA · PENSAMENTO</div>
        </div>
        <div>
          <div className="eyebrow">DO MANUSCRITO À PUBLICAÇÃO</div>
          <h2>Uma obra tem seu próprio percurso.</h2>
          <p>
            Apresente a sinopse, os capítulos previstos, a autoria e o estágio do trabalho. Livros completos e
            manuscritos em desenvolvimento podem ser submetidos à avaliação editorial.
          </p>
          <div className="notice">
            Um livro não recebe automaticamente um selo científico. A avaliação depende do formato, das fontes e do método da obra.
          </div>
          <OpenFormButton kind="book" className="outline">
            Apresentar minha obra
          </OpenFormButton>
        </div>
      </div>
      <div className="glass workspace">
        <div className="section-heading">
          <h2>Meus manuscritos enviados</h2>
          <span className="type-label">Área privada · não publicados</span>
        </div>
        <SubmissionsList
          kind="book"
          loadingText="Carregando manuscritos…"
          empty={
            <div className="empty">
              <BookOpen size={36} />
              <h3>A biblioteca começa com uma obra.</h3>
              <p>Ainda não há livros publicados. Seus manuscritos enviados aparecerão nesta área para acompanhamento.</p>
              <OpenFormButton kind="book" className="primary">
                Submeter primeiro livro
              </OpenFormButton>
            </div>
          }
        />
      </div>
      <section className="three-grid process-cards">
        {[
          ["Autoria reconhecida", "O nome do autor acompanha a obra. Os direitos de publicação são definidos por escrito."],
          ["Avaliação adequada", "Ensaios, livros teóricos e obras de divulgação são avaliados conforme seu formato."],
          ["Projeto associado", "A produção de um livro também pode ser apresentada como projeto, com etapas e entregas definidas."],
        ].map(([t, d]) => (
          <div className="glass info-card" key={t}>
            <BookOpen />
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
