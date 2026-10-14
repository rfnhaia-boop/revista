import Link from "next/link";
import "./admin.css";
import { requireStaffPage } from "@/lib/admin";
import AdminNav from "./nav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gestão · Revista NEW", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaffPage();
  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <Link href="/" className="wordmark adm-brand">
          <span>Revista</span> NEW<span className="wordmark-dot">.</span>
        </Link>
        <div className="adm-who">
          <strong>{user.displayName}</strong>
          <small>{user.isAdmin ? "Administrador" : "Editorial"}</small>
        </div>
        <AdminNav isAdmin={user.isAdmin} />
        <Link href="/minha-new" className="adm-exit">
          ← Voltar ao site
        </Link>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
