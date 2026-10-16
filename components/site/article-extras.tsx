"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageCircle, Send, Star, Volume2 } from "lucide-react";
import { toast } from "sonner";

const audioBySlug: Record<string, string> = {
  // Only author-supplied podcasts are published here.
  "a-segunda-maca": "https://revista-new-validacao.dricapillica.chatgpt.site/audio/a-segunda-maca.mp3",
};

export function ArticleAudio({ slug, title }: { slug: string; title: string }) {
  const source = audioBySlug[slug];
  if (!source) return null;
  return <section className="article-audio glass" aria-label={`Podcast de ${title}`}>
    <div className="article-audio-icon"><Volume2 size={22} /></div>
    <div className="article-audio-copy"><span>PODCAST DA MATÉRIA</span><strong>{title}</strong><small>Áudio original enviado pelo autor</small></div>
    <audio className="article-audio-player" controls preload="metadata" src={source}>Seu navegador não reproduz este áudio.</audio>
  </section>;
}

export function ArticleFeedback({ slug, title }: { slug: string; title: string }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`new-feedback:${slug}`);
      if (!saved) return;
      const value = JSON.parse(saved) as { rating?: number; comment?: string };
      setRating(value.rating ?? 0); setComment(value.comment ?? ""); setSent(true);
    } catch {}
  }, [slug]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!rating) return toast.error("Escolha de uma a cinco estrelas.");
    localStorage.setItem(`new-feedback:${slug}`, JSON.stringify({ rating, comment: comment.trim(), title, createdAt: new Date().toISOString() }));
    setSent(true);
    toast.success("Sua avaliação foi registrada. Obrigado por ler.");
  }

  return <section className="article-feedback glass" aria-labelledby="article-feedback-title">
    <div className="article-feedback-heading"><div><span>SUA EXPERIÊNCIA DE LEITURA</span><h2 id="article-feedback-title">O que esta matéria despertou em você?</h2></div><MessageCircle size={28} /></div>
    <form onSubmit={submit}>
      <fieldset><legend>Dê uma nota para a matéria</legend><div className="article-stars" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`} aria-pressed={rating === value} onMouseEnter={() => setHovered(value)} onFocus={() => setHovered(value)} onBlur={() => setHovered(0)} onClick={() => { setRating(value); setSent(false); }}><Star size={30} fill={(hovered || rating) >= value ? "currentColor" : "none"} /></button>)}
      </div></fieldset>
      <label>Se quiser, conte o que achou<textarea value={comment} onChange={(event) => { setComment(event.target.value.slice(0, 800)); setSent(false); }} maxLength={800} rows={4} placeholder="Escreva seu comentário sobre a leitura..." /></label>
      <div className="article-feedback-footer"><small>{comment.length}/800</small><button className="primary" type="submit"><Send size={16} /> {sent ? "Atualizar avaliação" : "Enviar avaliação"}</button></div>
    </form>
    {sent && <p className="article-feedback-sent">Avaliação salva. Você pode alterar a nota ou o comentário quando quiser.</p>}
  </section>;
}
