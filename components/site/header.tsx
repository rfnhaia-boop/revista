"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LogOut, Menu, Search, Users, X } from "lucide-react";

export default function SiteHeader({
  signedIn,
  displayName,
  money,
}: {
  signedIn: boolean;
  displayName: string;
  money: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const links = [
    ["/", "Revista"],
    ["/explorar", "Explorar"],
    ["/pessoas", "Pessoas"],
    ...(money ? [["/marketplace", "Marketplace"]] : []),
    ["/livros", "Livros"],
    ["/selos", "Selos"],
  ];
  const isActive = (href: string) => (href === "/" ? path === "/" || path.startsWith("/revista") : path.startsWith(href));

  return (
    <header className="topbar">
      <Link href="/" className="wordmark" onClick={() => setOpen(false)}>
        <span>Revista</span> NEW<span className="wordmark-dot">.</span>
      </Link>
      <nav aria-label="Navegação principal" className={open ? "navigation open" : "navigation"}>
        {links.map(([href, label]) => (
          <Link key={href} href={href} className={isActive(href) ? "active" : ""} onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="nav-actions">
        {money && (
          <Link href="/apoie" className="primary small nav-support">
            <Heart size={14} /> Apoie a NEW
          </Link>
        )}
        <Link href="/#search" className="iconbutton searchnav" aria-label="Pesquisar artigos">
          <Search size={19} />
        </Link>
        {signedIn ? (
          <Link href="/minha-new" className="outline small">
            <Users size={15} />
            <span>{displayName}</span>
          </Link>
        ) : (
          <Link href="/entrar" className="outline small">
            <Users size={15} />
            <span>Entrar</span>
          </Link>
        )}
        {signedIn && (
          <button
            className="iconbutton"
            aria-label="Sair da conta"
            title="Sair"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
              router.refresh();
            }}
          >
            <LogOut size={18} />
          </button>
        )}
        <button className="iconbutton mobile-toggle" aria-label={open ? "Fechar menu" : "Abrir menu"} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
