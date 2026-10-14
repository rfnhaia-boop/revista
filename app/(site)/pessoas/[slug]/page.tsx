import CommunitySpace from "@/app/community";
import { getCurrentUser } from "@/lib/auth";
import { moneyEnabled } from "@/lib/features";

export const metadata = {
  title: "Caderno de autor · Revista NEW",
  description: "Pensamentos, textos e trabalhos em desenvolvimento de um autor independente.",
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  return <CommunitySpace key={slug} mode="pessoas" initialSlug={slug} signedIn={!!user} money={moneyEnabled()} />;
}
