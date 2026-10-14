import { requireStaffPage } from "@/lib/admin";
import ReviewPanel from "./panel";

export default async function Page() {
  await requireStaffPage();
  return (
    <>
      <header className="adm-head">
        <div>
          <div className="eyebrow">REVISTA</div>
          <h1>Revisão de artigos</h1>
          <p>Artigos enviados pelo público. Leia o texto completo, peça ajustes ou aprove e publique com o crédito do autor.</p>
        </div>
      </header>
      <ReviewPanel />
    </>
  );
}
