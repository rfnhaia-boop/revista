"use client";
import { useCallback, useEffect, useState } from "react";

export async function send<T = { saved?: boolean }>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || "Não foi possível concluir a ação.");
  return data;
}

export function useAdminList<T>(url: string) {
  const [items, setItems] = useState<T[] | null>(null);
  const [extra, setExtra] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      const data = (await res.json()) as { items?: T[]; error?: string } & Record<string, unknown>;
      if (!res.ok) throw new Error(data.error || "Falha ao carregar.");
      setItems(data.items ?? []);
      setExtra(data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar.");
      setItems([]);
    }
  }, [url]);

  useEffect(() => {
    let alive = true;
    fetch(url, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as { items?: T[]; error?: string } & Record<string, unknown>;
        if (!alive) return;
        if (!res.ok) {
          setError(data.error || "Falha ao carregar.");
          setItems([]);
        } else {
          setItems(data.items ?? []);
          setExtra(data);
        }
      })
      .catch(() => {
        if (alive) {
          setError("Falha ao carregar.");
          setItems([]);
        }
      });
    return () => {
      alive = false;
    };
  }, [url]);

  return { items, extra, error, reload };
}

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
export const fmtDate = dateFmt;

export function Pill({ tone, children }: { tone?: "ok" | "warn" | "bad" | "info"; children: React.ReactNode }) {
  return <span className={"adm-pill" + (tone ? " " + tone : "")}>{children}</span>;
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="adm-empty">
      <strong>{title}</strong>
      {text && <p>{text}</p>}
    </div>
  );
}

export function Loading() {
  return (
    <p className="adm-muted" role="status">
      Carregando…
    </p>
  );
}
