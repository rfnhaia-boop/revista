import { redirect } from "next/navigation";
import { getCurrentUser, safeReturnPath } from "@/lib/auth";
import EntrarForm from "./form";
import Link from "next/link";
import { privateReviewMode } from "@/lib/runtime-mode";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entrar · Revista NEW" };

export default async function Page({ searchParams }: { searchParams: Promise<{ return_to?: string }> }) {
  if (privateReviewMode()) return <main className="na-wrap"><section className="glass na-card">
    <div className="eyebrow">VALIDAÇÃO PRIVADA</div>
    <h1>Continue pela leitura.</h1>
    <p>As matérias e a navegação estão disponíveis para revisão. Contas, publicação de textos e envios não estão conectados nesta versão.</p>
    <div className="na-actions"><Link className="primary" href="/">Explorar a Revista</Link><Link className="outline" href="/explorar">Ver as ideias</Link></div>
  </section></main>;
  const { return_to } = await searchParams;
  const returnTo = safeReturnPath(return_to ?? null);
  if (await getCurrentUser()) redirect(returnTo);
  return <EntrarForm returnTo={returnTo} />;
}
