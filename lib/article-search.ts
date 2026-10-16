export function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

export function matchesArticle(article: { title: string; summary: string; area: string; author: string }, area: string, query: string) {
  return (area === "Todos" || article.area === area)
    && normalizeSearch(`${article.title} ${article.summary} ${article.area} ${article.author}`).includes(normalizeSearch(query));
}
