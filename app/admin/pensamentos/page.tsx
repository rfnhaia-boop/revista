import { requireStaffPage } from "@/lib/admin";
import ThoughtsPanel from "./panel";

export default async function Page() {
  await requireStaffPage();
  return (
    <>
      <header className="adm-head">
        <div>
          <div className="eyebrow">COMUNIDADE</div>
          <h1>Pensamentos</h1>
          <p>Qualquer pessoa com conta publica pensamentos nos Cadernos. Aqui a equipe oculta o que violar as regras da plataforma.</p>
        </div>
      </header>
      <ThoughtsPanel />
    </>
  );
}
