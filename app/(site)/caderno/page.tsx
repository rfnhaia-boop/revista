import CadernoHome from "@/app/caderno-home";
import { getCurrentUser } from "@/lib/auth";
import { moneyEnabled } from "@/lib/features";

export const metadata = { title: "Meu Caderno · Revista NEW", description: "Escreva, acompanhe quem lê e converse com seus leitores." };

export default async function Page({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const [user, sp] = await Promise.all([getCurrentUser(), searchParams]);
  return <CadernoHome signedIn={!!user} initialTab={sp.aba || ""} moneyOn={moneyEnabled()} />;
}
