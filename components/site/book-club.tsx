"use client";

import Link from "next/link";
import { ArrowRight, BookMarked, CalendarDays, Check, Crown, MessageCircle, Quote, Sparkles, Tags } from "lucide-react";

export default function BookClub() {
  return (
    <>
      <section className="book-club-hero glass">
        <div className="book-club-copy">
          <span className="eyebrow"><span className="line" /> CLUBE DO LIVRO NEW</span>
          <h2>Um livro por semana.<br /><em>Uma leitura que continua.</em></h2>
          <p>Toda semana, uma obra ou trecho entra em debate. Você lê, marca passagens, organiza ideias e participa da conversa com outros leitores.</p>
          <div className="book-club-actions"><Link href="/livros/dom-casmurro" className="primary">Abrir leitura da semana <ArrowRight size={17} /></Link><a href="#como-funciona" className="textbutton">Como funciona</a></div>
        </div>
        <div className="book-club-edition">
          <div className="book-edition-top"><span>LEITURA 01</span><span>DOMÍNIO PÚBLICO</span></div>
          <div className="book-monogram">DC</div>
          <div><small>MACHADO DE ASSIS</small><h3>Dom Casmurro</h3><p>Memória, ciúme e a dúvida construída por quem narra.</p></div>
          <div className="book-edition-bottom"><CalendarDays size={15} /> Clube piloto · leitura aberta</div>
        </div>
      </section>

      <section className="interactive-library" id="como-funciona">
        <div className="section-heading"><div><span className="eyebrow">EDIÇÕES INTERATIVAS</span><h2>Comece de graça.<br />Depois, escolha sua próxima leitura.</h2></div><span className="book-price">GRÁTIS <small>livros selecionados com todas as ferramentas</small></span></div>
        <div className="book-feature-grid">
          {[
            [Quote, "Trabalhe frase por frase", "Selecione uma passagem e transforme-a em citação, pergunta ou ponto de análise."],
            [Tags, "Etiquete suas ideias", "Crie temas como memória, poder, psicologia e linguagem e reencontre tudo depois."],
            [MessageCircle, "Escreva ao lado do texto", "Notas pessoais ficam ligadas exatamente ao trecho que provocou a reflexão."],
            [BookMarked, "Monte seu caderno", "Reúna marcações, comentários e conexões numa leitura que passa a ser sua."],
          ].map(([Icon, title, text]) => {
            const ItemIcon = Icon as typeof Quote;
            return <article className="glass book-feature" key={String(title)}><ItemIcon /><h3>{String(title)}</h3><p>{String(text)}</p></article>;
          })}
        </div>
      </section>

      <section className="book-shelf-preview">
        <article className="glass book-offer free"><span>GRÁTIS · ACESSO COMPLETO</span><h3>Dom Casmurro</h3><p>Leia e teste marcações, etiquetas, notas e seu caderno pessoal sem pagar.</p><Link href="/livros/dom-casmurro">Ler gratuitamente <ArrowRight size={16} /></Link></article>
        <article className="glass book-offer paid"><span>EDIÇÕES PAGAS · EM BREVE</span><h3>Novos livros, novas leituras</h3><p>Cada edição poderá ser comprada separadamente, já com todas as ferramentas interativas incluídas.</p><strong>A partir de R$ 5 por livro</strong></article>
      </section>

      <section className="book-pass glass">
        <div><span className="eyebrow"><Crown size={15} /> PASSE NEW</span><h2>Uma biblioteca inteira,<br /><em>um único acesso.</em></h2><p>Quem preferir não comprar livro por livro poderá assinar o Passe NEW e acessar toda a biblioteca, além do histórico dos clubes e do caderno de leitura.</p></div>
        <ul><li><Check size={15} /> Todas as edições interativas</li><li><Check size={15} /> Clube do livro semanal</li><li><Check size={15} /> Caderno pessoal de citações</li><li><Sparkles size={15} /> Preço de lançamento em definição</li></ul>
        <button className="outline" disabled>Entrar na lista em breve</button>
      </section>
    </>
  );
}
