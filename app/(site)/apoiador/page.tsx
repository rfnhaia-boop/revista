import { notFound } from "next/navigation";
import ProjectsSpace from "@/app/projects-space";
import { getCurrentUser } from "@/lib/auth";
import { moneyEnabled } from "@/lib/features";

export const metadata = { title: "Área do apoiador · Revista NEW", robots: { index: false } };

export default async function Page() {
  if (!moneyEnabled()) notFound();
  const user = await getCurrentUser();
  return <ProjectsSpace mode="apoiador" signedIn={!!user} money />;
}
