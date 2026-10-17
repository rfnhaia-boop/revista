import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { moneyEnabled } from "@/lib/features";
import Subscriptions from "./subscriptions";

export const metadata = { title: "Minhas assinaturas · Revista NEW", robots: { index: false } };

export default async function Page() {
  if (!moneyEnabled()) notFound();
  const user = await getCurrentUser();
  return <Subscriptions signedIn={!!user} />;
}
