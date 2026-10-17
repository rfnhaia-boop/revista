import { Toaster } from "sonner";
import { getCurrentUser } from "@/lib/auth";
import { moneyEnabled } from "@/lib/features";
import SiteHeader from "./header";
import SubNav from "./subnav";
import SiteFooter from "./footer";
import { SubmissionsProvider } from "./submissions";
import { privateReviewMode } from "@/lib/runtime-mode";
import { hasAcceptedCurrent } from "@/lib/terms";
import TermsNotice from "./terms-notice";

export default async function SiteShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const money = moneyEnabled();
  const needsTerms = !!user && !(await hasAcceptedCurrent(user.userId).catch(() => true));
  return (
    <SubmissionsProvider signedIn={!!user}>
      <Toaster theme="dark" richColors />
      <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
      <SiteHeader signedIn={!!user} displayName={user?.fullName || "Minha área"} money={money} />
      <div className="editionbar">
        <span>IDEIAS · CIÊNCIA · FUTURO</span>
        <span>
          EDIÇÃO ZERO <i /> BRASIL, 2026
        </span>
      </div>
      <SubNav staff={!!user?.isStaff} money={money} />
      {privateReviewMode() && <div className="review-notice">Validação privada · Leitura e navegação disponíveis. Contas e envios não conectados.</div>}
      {needsTerms && <TermsNotice />}
      <main id="main-content" tabIndex={-1}>{children}</main>
      <SiteFooter money={money} staff={!!user?.isStaff} />
    </SubmissionsProvider>
  );
}
