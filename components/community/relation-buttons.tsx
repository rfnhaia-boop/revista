"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, Check, UserPlus } from "lucide-react";
import { toast } from "sonner";

async function relate(action: "follow" | "bookmark", targetId: string, enabled: boolean) {
  const r = await fetch("/api/community", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, targetId, enabled }),
  });
  const d = (await r.json().catch(() => ({}))) as { error?: string };
  if (!r.ok) throw new Error(d.error || "Não foi possível concluir.");
}

function useLogin(signedIn: boolean) {
  const router = useRouter();
  const path = usePathname();
  return () => {
    if (signedIn) return false;
    toast.info("Entre na sua conta para continuar.");
    router.push(`/entrar?return_to=${encodeURIComponent(path)}`);
    return true;
  };
}

export function BookmarkButton({ postId, saved, signedIn }: { postId: string; saved: boolean; signedIn: boolean }) {
  const [on, setOn] = useState(saved);
  const [busy, setBusy] = useState(false);
  const needLogin = useLogin(signedIn);
  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (needLogin() || busy) return;
    setBusy(true);
    const next = !on;
    setOn(next);
    try {
      await relate("bookmark", postId, next);
      toast.success(next ? "Leitura salva." : "Leitura removida.");
    } catch (err) {
      setOn(!next);
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <button className={"cm-icon" + (on ? " on" : "")} onClick={toggle} aria-pressed={on} aria-label={on ? "Remover dos salvos" : "Salvar para ler depois"} title={on ? "Salvo" : "Salvar"}>
      <Bookmark size={18} fill={on ? "currentColor" : "none"} />
    </button>
  );
}

export function FollowButton({ profileId, following, signedIn, size = "md", onChange }: { profileId: string; following: boolean; signedIn: boolean; size?: "sm" | "md"; onChange?: (now: boolean) => void }) {
  const [on, setOn] = useState(following);
  const [busy, setBusy] = useState(false);
  const needLogin = useLogin(signedIn);
  async function toggle() {
    if (needLogin() || busy) return;
    setBusy(true);
    const next = !on;
    setOn(next);
    try {
      await relate("follow", profileId, next);
      onChange?.(next);
    } catch (err) {
      setOn(!next);
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <button className={`cm-follow ${size} ${on ? "on" : ""}`} onClick={() => void toggle()} aria-pressed={on}>
      {on ? <Check size={15} /> : <UserPlus size={15} />} {on ? "Seguindo" : "Seguir"}
    </button>
  );
}
