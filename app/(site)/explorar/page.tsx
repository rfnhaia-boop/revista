import CommunitySpace from "@/app/community";
import { getCurrentUser } from "@/lib/auth";
import { moneyEnabled } from "@/lib/features";

export const metadata = { title: "Explorar ideias · Revista NEW", description: "Descubra textos, autores e pesquisas em andamento na comunidade da Revista NEW." };

export default async function Page() {
  const user = await getCurrentUser();
  return <CommunitySpace mode="explorar" signedIn={!!user} money={moneyEnabled()} />;
}
