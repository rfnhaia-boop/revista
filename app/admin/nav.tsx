"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ClipboardCheck, FileQuestion, Inbox, KeyRound, LayoutDashboard, MessageSquareText, ShieldCheck, Users } from "lucide-react";

const items = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, adminOnly: false },
  { href: "/admin/artigos", label: "Artigos da Revista", icon: BookOpen, adminOnly: false },
  { href: "/admin/revisao", label: "Revisão de artigos", icon: ClipboardCheck, adminOnly: false },
  { href: "/admin/pensamentos", label: "Pensamentos", icon: MessageSquareText, adminOnly: false },
  { href: "/admin/envios", label: "Outros envios", icon: Inbox, adminOnly: false },
  { href: "/admin/perguntas", label: "Perguntas", icon: FileQuestion, adminOnly: false },
  { href: "/admin/acessos", label: "Pedidos de acesso", icon: ShieldCheck, adminOnly: true },
  { href: "/admin/convites", label: "Convites", icon: KeyRound, adminOnly: true },
  { href: "/admin/usuarios", label: "Usuários", icon: Users, adminOnly: true },
];

export default function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  return (
    <nav className="adm-nav" aria-label="Gestão">
      {items
        .filter((i) => isAdmin || !i.adminOnly)
        .map((i) => {
          const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
          return (
            <Link key={i.href} href={i.href} className={active ? "active" : ""}>
              <i.icon size={17} />
              <span>{i.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}
