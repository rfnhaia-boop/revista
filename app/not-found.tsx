import { getCurrentUser } from "@/lib/auth";
import { NotAvailableView } from "@/components/site/unavailable";

export default async function NotFound() {
  const user = await getCurrentUser().catch(() => null);
  return <NotAvailableView signedIn={!!user} />;
}
