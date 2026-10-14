import { notFound } from "next/navigation";
import CommunitySpace from "@/app/community";
import { getCurrentUser } from "@/lib/auth";
import { moneyEnabled } from "@/lib/features";

export const metadata = { title: "Marketplace de conhecimento · Revista NEW" };

export default async function Page() {
  if (!moneyEnabled()) notFound();
  const user = await getCurrentUser();
  return <CommunitySpace mode="marketplace" signedIn={!!user} money />;
}
