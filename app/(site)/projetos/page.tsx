import ProjectsSpace from "@/app/projects-space";
import { getCurrentUser } from "@/lib/auth";
import { moneyEnabled } from "@/lib/features";

export const metadata = {
  title: "Projetos · Revista NEW",
  description: "Projetos de conhecimento com problema, orçamento, etapas e prestação de contas.",
};

export default async function Page() {
  const user = await getCurrentUser();
  return <ProjectsSpace mode="projetos" signedIn={!!user} money={moneyEnabled()} />;
}
