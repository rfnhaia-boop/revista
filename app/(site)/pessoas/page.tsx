import CommunitySpace from "@/app/community";
import { getCurrentUser } from "@/lib/auth";
import { moneyEnabled } from "@/lib/features";

export const metadata = { title: "Pessoas · Revista NEW", description: "Encontre autores independentes e conheça seus Cadernos." };

export default async function Page() {
  const user = await getCurrentUser();
  return <CommunitySpace mode="pessoas" signedIn={!!user} money={moneyEnabled()} />;
}
