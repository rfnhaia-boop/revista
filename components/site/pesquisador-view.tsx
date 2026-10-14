"use client";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { stages } from "@/lib/content";
import { OpenFormButton, SubmissionsList, useSubmissions, type FormKind } from "./submissions";

const cards: [FormKind, string, string][] = [
  ["book", "Livro", "Apresente a sinopse, a estrutura e o estágio do manuscrito."],
  ["project", "Projeto de pesquisa", "Apresente o método e os recursos necessários."],
  ["application", "Candidatura", "Proponha como investigar uma demanda da comunidade."],
];

export default function PesquisadorView() {
  const { items, state, reload } = useSubmissions();
  const count = (st: string) => items.filter((i) => i.status === st).length;
  const ready = state === "ready";
  const stats: [string, number | string][] = [
    ["Seus envios", ready ? items.length : "–"],
    ["Recebidos", ready ? count("received") : "–"],
    ["Em análise", ready ? count("reviewing") + count("changes_requested") : "–"],
    ["Aceitos", ready ? count("accepted") : "–"],
  ];
  return (
    <>
      <div className="stats-grid">
        {stats.map(([l, v]) => (
          <div className="stat glass" key={l}>
            <span>{l}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <Tabs defaultValue="submissions">
        <TabsList className="view-tabs">
          <TabsTrigger value="submissions">Minhas submissões</TabsTrigger>
          <TabsTrigger value="journey">Jornada editorial</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions">
          <div className="glass workspace">
            <div className="section-heading">
              <h2>Seu trabalho, acompanhado.</h2>
              <button className="textbutton" onClick={() => void reload()}>
                Atualizar
              </button>
            </div>
            <SubmissionsList
              loadingText="Carregando seus envios…"
              empty={
                <div className="empty">
                  <FileText size={36} />
                  <h3>Seu primeiro trabalho entra aqui.</h3>
                  <p>Envie um artigo, livro, proposta de pesquisa ou candidatura.</p>
                  <Link className="outline" href="/escrever">
                    Escrever um artigo
                  </Link>
                </div>
              }
            />
          </div>
        </TabsContent>
        <TabsContent value="journey">
          <div className="stage-grid">
            {stages.map((s) => (
              <div key={s.n} className="stage glass">
                <span className="eyebrow">ETAPA {s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      <div className="three-grid process-cards">
        <Link href="/escrever" className="glass info-card action-card">
          <Plus />
          <h3>Artigo ou ensaio</h3>
          <p>Escreva e envie para a revisão da equipe. Se aprovado, é publicado na Revista.</p>
        </Link>
        {cards.map(([k, t, d]) => (
          <OpenFormButton key={k} kind={k} className="glass info-card action-card">
            <Plus />
            <h3>{t}</h3>
            <p>{d}</p>
          </OpenFormButton>
        ))}
      </div>
    </>
  );
}
