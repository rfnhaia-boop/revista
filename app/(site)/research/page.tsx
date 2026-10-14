import Link from "next/link";
import { Check, FileQuestion, ShieldCheck } from "lucide-react";
import PageHead from "@/components/site/page-head";
import { ApplyButton, ExamButton, ProposeQuestionButton } from "@/components/site/research-actions";
import { listPublicQuestions } from "@/lib/public-data";

export const metadata = {
  title: "Perguntas públicas · Revista NEW",
  description: "Perguntas da comunidade que merecem uma pesquisa. Você traz o problema; pessoas qualificadas propõem como investigá-lo.",
};

export default async function Page() {
  const questions = await listPublicQuestions();
  return (
    <>
      <PageHead
        eyebrow="NEW RESEARCH"
        title="Qual pergunta merece uma pesquisa?"
        text="Você traz o problema. Pessoas qualificadas propõem como investigá-lo."
        action={<ProposeQuestionButton />}
      />
      <div className="split">
        <div className="question-list">
          {questions.length === 0 && (
            <div className="glass empty">
              <FileQuestion size={34} />
              <h3>Nenhuma pergunta publicada ainda</h3>
              <p>As perguntas enviadas pela comunidade passam por uma triagem e aparecem aqui quando aprovadas. Proponha a primeira.</p>
              <ProposeQuestionButton>Propor a primeira pergunta</ProposeQuestionButton>
            </div>
          )}
          {questions.map((q, i) => (
            <article className="question glass" key={q.id}>
              <div className="question-number">{String(i + 1).padStart(2, "0")}</div>
              <div>
                <div className="card-meta">
                  <span>{q.status === "selected" ? "PERGUNTA SELECIONADA" : "PERGUNTA DA COMUNIDADE"}</span>
                </div>
                <h3>{q.title}</h3>
                <p>{q.context}</p>
                <p className="fine">Por que importa: {q.importance}</p>
                <div className="question-meta">
                  <span>{new Date(q.createdAt).toLocaleDateString("pt-BR")}</span>
                  <span>{q.status === "selected" ? "Aberta a candidaturas" : "Em avaliação para chamada"}</span>
                </div>
                {q.status === "selected" && (
                  <div className="actions">
                    <ApplyButton>Propor investigação</ApplyButton>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
        <aside className="glass info-card selection">
          <div className="eyebrow">SELEÇÃO POR COMPETÊNCIA</div>
          <h2>Uma boa pergunta exige um bom método.</h2>
          <ol>
            {[
              "Experiência e formação pertinentes",
              "Teste específico sobre o tema",
              "Proposta, orçamento e cronograma",
              "Conflitos de interesse declarados",
              "Aprovação ética, quando aplicável",
            ].map((s) => (
              <li key={s}>
                <Check size={16} />
                {s}
              </li>
            ))}
          </ol>
          <ExamButton />
          <p className="fine">
            O teste apoia a seleção e não substitui experiência, análise metodológica ou revisão ética.
          </p>
        </aside>
      </div>
      <div className="contract-callout glass">
        <ShieldCheck />
        <div>
          <h3>A conclusão não é uma condição de aprovação.</h3>
          <p>
            Hipóteses contrariadas e resultados inconclusivos podem ser entregas de qualidade. A avaliação verifica a execução e as evidências.
          </p>
        </div>
        <Link className="outline" href="/protocolo">
          Ver etapas
        </Link>
      </div>
    </>
  );
}
