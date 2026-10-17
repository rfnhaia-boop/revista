import { getCurrentUser } from "@/lib/auth";
import { NotAvailableView } from "@/components/site/unavailable";
import SiteShell from "@/components/site/site-shell";

export default async function NotFound() {
  const user = await getCurrentUser().catch(() => null);
  return <SiteShell><NotAvailableView signedIn={!!user} /></SiteShell>;
}
