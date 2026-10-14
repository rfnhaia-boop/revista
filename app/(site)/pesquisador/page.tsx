import { Plus } from "lucide-react";
import PageHead from "@/components/site/page-head";
import PesquisadorView from "@/components/site/pesquisador-view";
import Link from "next/link";

export const metadata = { title: "Área do pesquisador · Revista NEW", robots: { index: false } };

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="ÁREA DO PESQUISADOR"
        title="Toda pesquisa começa em algum lugar."
        text="Envie livros, projetos e candidaturas e acompanhe o andamento. Artigos têm um editor próprio. A publicação depende de avaliação editorial."
        action={
          <Link className="primary" href="/escrever">
            <Plus size={17} /> Escrever artigo
          </Link>
        }
      />
      <PesquisadorView />
    </>
  );
}
