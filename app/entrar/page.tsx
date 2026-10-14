import { redirect } from "next/navigation";
import { getCurrentUser, safeReturnPath } from "@/lib/auth";
import EntrarForm from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entrar · Revista NEW" };

export default async function Page({ searchParams }: { searchParams: Promise<{ return_to?: string }> }) {
  const { return_to } = await searchParams;
  const returnTo = safeReturnPath(return_to ?? null);
  if (await getCurrentUser()) redirect(returnTo);
  return <EntrarForm returnTo={returnTo} />;
}
