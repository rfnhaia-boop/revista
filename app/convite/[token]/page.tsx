import type { Metadata } from "next";
import InviteExperience from "./experience";

export const metadata: Metadata = {
  title: "Um convite para a Revista NEW",
  description: "Você recebeu um convite pessoal para participar da comunidade da Revista NEW.",
};

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InviteExperience token={token} />;
}
