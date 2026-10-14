// Insere os artigos editoriais iniciais (idempotente: ignora slugs existentes).
import { randomUUID } from "node:crypto";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL ausente");

const VERSION = "Apresentação editorial v0.1 · 08/10/2026. Histórico científico ainda não disponível.";
const PULL = "A comunidade financia perguntas, nunca respostas.";

const articles = [
  {
    slug: "flow-arquetipico-identidade-em-movimento",
    title: "Flow Arquetípico: identidade em movimento",
    summary: "Uma investigação sobre a continuidade simbólica, os papéis sociais e as transformações humanas.",
    area: "Psicologia",
    kind: "Pesquisa teórica em desenvolvimento",
    authorName: "Rafael · NEW",
    readingMinutes: 6,
    kicker: "IDENTIDADE",
    sortOrder: 1,
    body:
      "O Flow Arquetípico é uma proposta de investigação teórica em desenvolvimento. A questão central é como padrões simbólicos, funcionais e psicológicos podem manter continuidade ao longo de mudanças de papel e de contexto. Uma pessoa pode manifestar múltiplas personas e padrões: ser aluno em uma relação e líder em outra não implica duas identidades totalmente desconectadas.\n\nO programa de pesquisa pretende distinguir núcleo arquetípico, transformação e critérios de refutação. Cada conceito deverá ter definição explícita, origem teórica e significado operacional. Este texto apresenta a direção do trabalho; não contém resultados empíricos, revisão por pares ou uma teoria validada.",
    referencesText:
      "Manuscrito completo e referências ainda em preparação. Esta apresentação editorial não substitui o estudo.",
  },
  {
    slug: "o-que-significa-pensar-com-uma-inteligencia-artificial",
    title: "O que significa pensar com uma inteligência artificial?",
    summary: "Entre ampliar nossas perguntas e delegar nosso julgamento, existe uma escolha humana.",
    area: "Tecnologia",
    kind: "Ensaio editorial",
    authorName: "Editorial NEW",
    readingMinutes: 4,
    kicker: "INTELIGÊNCIA",
    sortOrder: 2,
    body:
      "Pensar com uma ferramenta exige decidir quais partes do processo permanecem sob nosso julgamento. Uma resposta fluente pode abrir uma hipótese, organizar argumentos ou sugerir um caminho. A verificação das fontes e a responsabilidade por uma conclusão continuam sendo tarefas humanas.\n\nA proposta da NEW é investigar essa relação com perguntas claras: quais tarefas melhoram, para quem e em quais condições? Um ensaio pode ajudar a formular a pergunta. Um estudo precisa descrever método, evidências e limites. Confundir essas duas etapas diminui a qualidade do debate.",
    referencesText:
      "Ensaio original de apresentação editorial. Não apresenta afirmações empíricas ou parecer científico.",
  },
  {
    slug: "a-comunidade-pergunta-a-ciencia-investiga",
    title: "A comunidade pergunta. A ciência investiga.",
    summary: "Como transformar uma curiosidade coletiva em uma investigação responsável.",
    area: "Sociedade",
    kind: "Carta de princípios",
    authorName: "Editorial NEW",
    readingMinutes: 3,
    kicker: "SOCIEDADE",
    sortOrder: 3,
    body:
      "Uma pergunta relevante pode nascer fora de uma universidade. Quem observa um problema na própria comunidade pode ajudar a definir o que merece atenção, mesmo sem conhecer o método necessário para estudá-lo.\n\nO apoio financeiro deve comprar condições de trabalho e investigação, sem comprar uma conclusão. Hipóteses contrariadas e resultados inconclusivos também precisam ser publicados quando o estudo foi executado adequadamente. A transparência registra tanto o percurso quanto os limites.",
    referencesText: "Princípios propostos para a plataforma NEW. Política editorial em formação.",
  },
];

const client = new pg.Client({ connectionString: url });
await client.connect();
const now = new Date().toISOString();
for (const a of articles) {
  const r = await client.query(
    `INSERT INTO articles (id,slug,title,summary,area,kind,author_name,reading_minutes,kicker,sort_order,body,pullquote,references_text,status_note,version_note,status,published_at,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'published',$16,$16,$16)
     ON CONFLICT (slug) DO NOTHING`,
    [randomUUID(), a.slug, a.title, a.summary, a.area, a.kind, a.authorName, a.readingMinutes, a.kicker, a.sortOrder,
     a.body, PULL, a.referencesText, "Não revisado por pares.", VERSION, "2026-10-08T12:00:00.000Z"],
  );
  console.log(r.rowCount ? "inserido" : "já existia", a.slug);
}
void now;
await client.end();
