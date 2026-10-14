"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, EyeOff, Eye, Send } from "lucide-react";
import type { Entry } from "@/lib/community-types";
import { REPLY_MAX, type Conversation } from "@/lib/engagement";

type Conv = Conversation & { canModerate: boolean };
const post = (payload: unknown) =>
  fetch("/api/community/engage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
const when = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

/** Curtida "Isso me ajudou" + respostas de um pensamento. Também registra a leitura (anônima). */
export default function NotebookConversation({
  entry,
  signedIn,
  onNeedLogin,
  onChange,
  loginHref,
}: {
  entry: Pick<Entry, "id" | "status" | "isMine">;
  signedIn: boolean;
  onNeedLogin?: () => void;
  onChange?: () => void;
  loginHref?: string;
}) {
  const [conv, setConv] = useState<Conv | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const published = entry.status === "published";
  const needLogin = () => (onNeedLogin ? onNeedLogin() : router.push(loginHref || "/entrar"));
  const changed = useRef<() => void>(() => {});
  useEffect(() => {
    changed.current = onChange ?? (() => {});
  });

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/community/engage?post=${entry.id}`);
      if (r.ok) setConv((await r.json()) as Conv);
    } catch {
      /* mantém o que já está na tela */
    }
  }, [entry.id]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
      if (published && !entry.isMine) void post({ action: "view", postId: entry.id }).catch(() => {});
    }, 0);
    return () => clearTimeout(t);
  }, [entry.id, entry.isMine, published, load]);

  // O autor abriu: as respostas novas passam a "vistas".
  const hasNew = !!conv?.replies.some((r) => r.isNew);
  useEffect(() => {
    if (!entry.isMine || !hasNew) return;
    const t = setTimeout(() => void post({ action: "mark-seen", postId: entry.id }).then(() => load()).then(() => changed.current()).catch(() => {}), 1500);
    return () => clearTimeout(t);
  }, [entry.isMine, entry.id, hasNew, load]);

  async function like() {
    if (!signedIn) return needLogin();
    if (!conv) return;
    const enabled = !conv.likedByMe;
    setConv({ ...conv, likedByMe: enabled, likes: conv.likes + (enabled ? 1 : -1) });
    const r = await post({ action: "react", postId: entry.id, enabled }).catch(() => null);
    if (!r?.ok) await load();
    changed.current();
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!signedIn) return needLogin();
    setSending(true);
    setError("");
    try {
      const r = await post({ action: "reply", postId: entry.id, body: text });
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(d.error || "Não foi possível enviar.");
      setText("");
      await load();
      changed.current();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar.");
    } finally {
      setSending(false);
    }
  }

  async function moderate(id: string, hidden: boolean) {
    const r = await post({ action: "hide-reply", replyId: id, hidden }).catch(() => null);
    if (r?.ok) {
      await load();
      changed.current();
    }
  }

  if (!published) return null;
  const visible = conv?.replies.filter((r) => r.status === "visible").length ?? 0;
  return (
    <section className="conv" aria-label="Respostas">
      <div className="conv-bar">
        <button className={conv?.likedByMe ? "conv-like on" : "conv-like"} onClick={() => void like()} aria-pressed={!!conv?.likedByMe}>
          <Heart size={16} fill={conv?.likedByMe ? "currentColor" : "none"} /> Isso me ajudou
          <b>{conv?.likes ?? 0}</b>
        </button>
      </div>
      <h3 className="conv-title">Respostas{conv ? ` (${visible})` : ""}</h3>
      {conv && conv.replies.length === 0 && (
        <p className="conv-empty">Ainda ninguém respondeu. Seja a primeira pessoa a dizer o que isso despertou.</p>
      )}
      <ul className="conv-list">
        {conv?.replies.map((r) => (
          <li key={r.id} className={r.status === "hidden" ? "conv-item hidden" : "conv-item"}>
            <div className="conv-head">
              <span className="avatar-text">{r.authorName.slice(0, 1)}</span>
              <strong>{r.authorName}</strong>
              <small>{when(r.createdAt)}</small>
              {r.isNew && <span className="conv-new">nova</span>}
              {r.status === "hidden" && <span className="conv-flag">oculta</span>}
              {conv.canModerate && !r.isMine && (
                <button className="textbutton conv-mod" onClick={() => void moderate(r.id, r.status === "visible")}>
                  {r.status === "visible" ? (
                    <>
                      <EyeOff size={14} /> Ocultar
                    </>
                  ) : (
                    <>
                      <Eye size={14} /> Reexibir
                    </>
                  )}
                </button>
              )}
            </div>
            <p>{r.body}</p>
          </li>
        ))}
      </ul>
      <form className="conv-form" onSubmit={send}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={REPLY_MAX}
          rows={3}
          aria-label="Sua resposta"
          placeholder={signedIn ? "Escreva uma resposta respeitosa…" : "Entre na sua conta para responder"}
          disabled={!signedIn}
        />
        <div className="conv-foot">
          <small>{text.length}/{REPLY_MAX}</small>
          {signedIn ? (
            <button className="primary" disabled={sending || text.trim().length < 2}>
              <Send size={15} /> {sending ? "Enviando…" : "Responder"}
            </button>
          ) : (
            <button type="button" className="primary" onClick={needLogin}>
              Entrar para responder
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
