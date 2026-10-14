import { Toaster } from "sonner";
import { getCurrentUser } from "@/lib/auth";
import { moneyEnabled } from "@/lib/features";
import SiteHeader from "./header";
import SubNav from "./subnav";
import SiteFooter from "./footer";
import { SubmissionsProvider } from "./submissions";

export default async function SiteShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const money = moneyEnabled();
  return (
    <SubmissionsProvider signedIn={!!user}>
      <Toaster theme="dark" richColors />
      <SiteHeader signedIn={!!user} displayName={user?.fullName || "Minha área"} money={money} />
      <div className="editionbar">
        <span>IDEIAS · CIÊNCIA · FUTURO</span>
        <span>
          EDIÇÃO ZERO <i /> BRASIL, 2026
        </span>
      </div>
      <SubNav staff={!!user?.isStaff} money={money} />
      <main>{children}</main>
      <SiteFooter money={money} staff={!!user?.isStaff} />
    </SubmissionsProvider>
  );
}
