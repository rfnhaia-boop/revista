import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import PageHead from "@/components/site/page-head";
import SimulatorCard from "@/components/site/simulator";
import { stages } from "@/lib/content";
import { moneyEnabled } from "@/lib/features";

export const metadata = {
  title: "Protocolo NEW · Rigor em cada etapa",
  description: "Uma trajetória documentada, da seleção do pesquisador à revisão independente.",
};

export default function Page() {
  const money = moneyEnabled();
  return (
    <>
      <PageHead
        eyebrow="PROTOCOLO NEW"
        title="Rigor em cada etapa."
        text="Uma trajetória documentada, da seleção do pesquisador à revisão independente."
        action={
          <Link className="outline" href="/selos">
            <ShieldCheck size={17} /> Conhecer os selos
          </Link>
        }
      />
      <div className="demo-banner">
        <ShieldCheck size={16} /> Proposta de governança em formação. Os selos explicam etapas; ainda não são emitidos.
      </div>
      <div className="stage-grid">
        {stages.map((s) => (
          <div className="stage glass" key={s.n}>
            <div className="stage-top">
              <span>{s.n}</span>
              <ShieldCheck size={21} />
            </div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            {money && (
              <div className="stage-bottom">
                <span>Repasse simulado</span>
                <strong>{s.pct}%</strong>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="split simulator-section" style={money ? undefined : { gridTemplateColumns: "1fr" }}>
        {money && <SimulatorCard />}
        <div className="glass info-card">
          <div className="eyebrow">O QUE CADA SELO SIGNIFICA</div>
          <h3>Revisão NEW</h3>
          <p>Verificação editorial interna e cumprimento dos critérios publicados.</p>
          <h3>Parecer independente</h3>
          <p>Análise por especialista externo identificado, com declaração de conflitos.</p>
          <h3>Revisado por pares</h3>
          <p>Processo documentado de avaliação por pares. Não é garantia de verdade definitiva.</p>
          <div className="notice">
            Publicação externa depende de terceiros. O contrato precisa prever prazo, correções, recurso e tratamento de atrasos.
          </div>
        </div>
      </div>
      <section className="glass info-card contract">
        <div className="eyebrow">PESQUISA ENCOMENDADA PELA NEW</div>
        <h2>O trabalho é contratado. A autoria é reconhecida.</h2>
        <div className="three-grid">
          <div>
            <h3>Escopo e execução</h3>
            <p>Pergunta, método, prazo, orçamento e entregas definidos no contrato de serviços de pesquisa.</p>
          </div>
          <div>
            <h3>Autoria e publicação</h3>
            <p>Crédito do pesquisador preservado. Direitos de uso e licença de publicação formalizados por escrito.</p>
          </div>
          <div>
            <h3>Transparência</h3>
            <p>Prestação de contas e desfecho documentados sem expor dados pessoais ou dados sensíveis.</p>
          </div>
        </div>
        <p className="fine">Estrutura contratual proposta, sujeita a revisão jurídica e contábil antes da operação.</p>
      </section>
    </>
  );
}
