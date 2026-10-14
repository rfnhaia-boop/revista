import Link from "next/link";

export type ArticleProgress = {
  id: string;
  title: string;
  status: string;
  reviewNote: string;
};

const STEPS = [
  ["draft", "Rascunho"],
  ["submitted", "Enviado"],
  ["reviewing", "Em revisão"],
  ["published", "Publicado"],
] as const;

const MESSAGES: Record<string, { title: string; text: string }> = {
  draft: {
    title: "Seu artigo ainda é um rascunho",
    text: "Ele só você vê. Quando estiver pronto, envie para a equipe revisar.",
  },
  submitted: {
    title: "Recebemos o seu artigo",
    text: "Ele está na fila da equipe editorial. Você será avisado aqui quando a revisão começar ou terminar.",
  },
  reviewing: {
    title: "A equipe está lendo o seu artigo",
    text: "A revisão já começou. Assim que for aprovado, ele entra na Revista com o seu nome.",
  },
  changes_requested: {
    title: "A equipe pediu ajustes",
    text: "Leia a nota abaixo, ajuste o texto e envie de novo. Você não perde nada do que já escreveu.",
  },
  rejected: {
    title: "Este artigo não foi aceito desta vez",
    text: "Veja o motivo abaixo. Você pode escrever outro quando quiser.",
  },
};

function Actions({ editHref }: { editHref?: string }) {
  return (
    <div className="na-actions">
      {editHref && (
        <Link href={editHref} className="primary">
          Abrir meu artigo
        </Link>
      )}
      <Link href="/minha-new" className={editHref ? "outline" : "primary"}>
        Voltar ao meu perfil
      </Link>
      <Link href="/revista" className="outline">
        Ir para a Revista
      </Link>
    </div>
  );
}

/** O leitor é o autor e o artigo ainda não foi publicado: mostra onde ele está. */
export function ArticleProgressView({ article }: { article: ArticleProgress }) {
  const msg = MESSAGES[article.status] ?? MESSAGES.draft;
  const at = STEPS.findIndex(([k]) => k === article.status);
  const editable = article.status === "draft" || article.status === "changes_requested";
  const showSteps = article.status !== "changes_requested" && article.status !== "rejected";
  return (
    <main className="na-wrap">
      <section className="glass na-card">
        <div className="eyebrow">Seu artigo · só você vê isto</div>
        <h1>{msg.title}</h1>
        <p className="na-title">“{article.title || "Sem título"}”</p>
        <p>{msg.text}</p>
        {showSteps && (
          <ol className="na-steps">
            {STEPS.map(([k, label], i) => (
              <li key={k} className={i < at ? "done" : i === at ? "now" : ""}>
                <span>{i < at ? "✓" : i + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        )}
        {article.reviewNote && (
          <blockquote className="na-note">
            <b>Nota da equipe</b>
            {article.reviewNote}
          </blockquote>
        )}
        <Actions editHref={`/escrever/${article.id}`} />
        {!editable && article.status !== "rejected" && (
          <p className="na-fine">Enquanto a equipe analisa, o texto fica bloqueado para edição.</p>
        )}
      </section>
    </main>
  );
}

/** Link inexistente ou de outra pessoa: nada de 404 seco. */
export function NotAvailableView({ signedIn }: { signedIn: boolean }) {
  return (
    <main className="na-wrap">
      <section className="glass na-card">
        <div className="eyebrow">Página indisponível</div>
        <h1>Esse texto não está disponível</h1>
        <p>
          Ele pode ainda não ter sido publicado, ter mudado de endereço ou o link pode estar incompleto.
          {signedIn
            ? " Se for um artigo seu, acompanhe o andamento no seu perfil."
            : " Se for um artigo seu, entre na sua conta para acompanhar o andamento."}
        </p>
        <div className="na-actions">
          {signedIn ? (
            <Link href="/minha-new" className="primary">
              Voltar ao meu perfil
            </Link>
          ) : (
            <Link href="/entrar" className="primary">
              Entrar na minha conta
            </Link>
          )}
          <Link href="/revista" className="outline">
            Ir para a Revista
          </Link>
        </div>
      </section>
    </main>
  );
}
