/**
 * Ajustes editoriais sobre o texto-base dos ensaios, para ficarem iguais aos do site da NEW:
 *  - nota de "Autoria e transparência" abrindo o ensaio;
 *  - a seção sobre o Flow Arquetípico, que o site traz e o texto-base não tinha.
 * Idempotente: se o trecho já está no corpo, não insere de novo.
 */

const AUTHOR_NOTE = {
  "a-segunda-maca": `> **Autoria e transparência · Rafael Falcetti Silva**
>
> Autor do ensaio e CEO da NEW Company. A argumentação e as interpretações autorais deste texto foram desenvolvidas por Rafael, com apoio editorial e de pesquisa em inteligência artificial. As evidências externas estão identificadas nas fontes.
>
> *“A segunda maçã”* é também o título de um livro sobre inteligência artificial que Rafael está escrevendo. A analogia central foi adaptada desse projeto ainda inédito para este ensaio.`,
  "democracia-da-influencia": `> **Autoria e transparência · Rafael Falcetti Silva**
>
> Autor do ensaio e fundador da NEW Company. A tese, as interpretações e a proposta foram desenvolvidas por Rafael, com apoio de IA na pesquisa, no confronto de argumentos e na organização editorial.
>
> *Congelamento do significado* integra o livro inédito *Nominalismo*. O *Flow Arquetípico* aparece como lente teórica em desenvolvimento, não como teoria cientificamente comprovada.`,
};

const FLOW_SECTION = {
  "a-segunda-maca": {
    before: "**04 · UMA POSSIBILIDADE**",
    marker: "04 · HIPÓTESE AUTORAL",
    // O site numera a nova seção como 04 e empurra as seguintes.
    renumber: [
      ["**05 · FILOSOFIA E RESPONSABILIDADE**", "**06 · FILOSOFIA E RESPONSABILIDADE**"],
      ["**04 · UMA POSSIBILIDADE**", "**05 · UMA POSSIBILIDADE**"],
    ],
    text: `**04 · HIPÓTESE AUTORAL**

## O Flow Arquetípico

> **Teoria em construção por Rafael Falcetti Silva.** Flow Arquetípico é uma formulação teórica autoral de Rafael Falcetti Silva, CEO da NEW Company. Ainda não foi publicada nem validada cientificamente: está em desenvolvimento, teste teórico e ampliação conceitual. Sua presença neste ensaio funciona como uma lente interpretativa, não como conclusão científica.

O conceito parte da hipótese de que, ao entrar profundamente em determinado fluxo simbólico, profissional ou social, uma pessoa pode começar a agir progressivamente segundo o arquétipo que ocupa. A função deixa de ser apenas algo que ela realiza e passa a organizar parte da persona que apresenta ao mundo.

Quando existe consciência, a pessoa consegue reconhecer tanto a potência quanto a sombra desse arquétipo. Quando não existe, ela pode representar o papel automaticamente e colocar sua moral pessoal em segundo plano. O arquétipo não possui moral fixa: sua energia pode construir ou destruir.

A inteligência artificial pode intensificar esse movimento. Ela aprende o contexto oferecido, acompanha a direção da conversa e ajuda o usuário a alcançar um resultado. Se a pessoa não reconhece o fluxo psicológico e simbólico no qual entrou, a ferramenta pode reforçar esse caminho — inclusive quando ele conduz ao excesso.`,
  },
  "democracia-da-influencia": {
    before: "## A democracia não precisa terminar. Precisa continuar evoluindo.",
    marker: "### A política como campo de observação do Flow Arquetípico",
    text: `### A política como campo de observação do Flow Arquetípico

O comportamento político oferece um campo para testar o **Flow Arquetípico**, estudo em desenvolvimento por Rafael Falcetti Silva. A hipótese investiga como a entrada contínua em um papel amplia comportamentos ligados a um arquétipo, principalmente quando existe pouca consciência sobre aquilo que se representa.

O político pode entrar no fluxo do governante, do guerreiro, do rebelde, do salvador ou do justiceiro. Nenhum arquétipo possui moral fixa. O guerreiro pode proteger ou destruir; o cuidador pode servir ou criar dependência; o rebelde pode romper uma injustiça ou transformar toda estabilidade em inimiga.

Quando a performance gera votos e reconhecimento, abandoná-la se torna caro. O público exige coerência: o combativo precisa de conflitos; o salvador, de dependentes; o justiceiro, de culpados.

> A pessoa já não utiliza apenas o arquétipo para conquistar poder. O poder utiliza o arquétipo para conduzir a pessoa.

O público reforça o personagem e o algoritmo mede a recompensa. Isso não comprova definitivamente a teoria; amplia seu campo de teste e ajuda a perguntar quando a persona deixa de ser ferramenta e passa a dirigir o indivíduo.`,
  },
};

/** Devolve uma cópia do artigo com o corpo ajustado (ou o próprio artigo, se não há ajuste para o slug). */
export function applyEditorialPatches(article) {
  const note = AUTHOR_NOTE[article.slug];
  const flow = FLOW_SECTION[article.slug];
  if (!note && !flow) return article;
  let body = article.body;
  if (note && !body.includes("Autoria e transparência")) body = `${note}\n\n${body}`;
  if (flow && !body.includes(flow.marker)) {
    const at = body.indexOf(flow.before);
    if (at < 0) throw new Error(`Âncora não encontrada em ${article.slug}: ${flow.before}`);
    body = `${body.slice(0, at)}${flow.text}\n\n${body.slice(at)}`;
    for (const [from, to] of flow.renumber ?? []) {
      if (!body.includes(from)) throw new Error(`Rótulo não encontrado em ${article.slug}: ${from}`);
      body = body.replace(from, to);
    }
  }
  return { ...article, body };
}
