import assert from 'node:assert/strict';
import { splitParagraphs, parseChapters, slugify, bookSchema, bookActionSchema, readerActionSchema, citationMarkdown } from '../lib/books-core.ts';

// parágrafos: separados por linha em branco; quebras simples viram espaço
assert.deepEqual(splitParagraphs('Um.\n\nDois\ncontinua.\r\n\r\n\r\nTrês.  '), ['Um.', 'Dois continua.', 'Três.']);
assert.deepEqual(splitParagraphs('   \n\n  '), []);

// capítulos: "# Título" abre capítulo; lixo antes do primeiro é ignorado; capítulo vazio some
const md = 'prefácio solto\n\n# Cap I\n\nA.\n\nB.\n\n# Vazio\n\n# Cap II — Fim\n\nC.';
assert.deepEqual(parseChapters(md), [{ title: 'Cap I', body: 'A.\n\nB.' }, { title: 'Cap II — Fim', body: 'C.' }]);
assert.deepEqual(parseChapters('sem titulo nenhum'), []);
assert.equal(parseChapters('# T\n\nx')[0].title, 'T');

assert.equal(slugify('Dom Casmurro'), 'dom-casmurro');
assert.equal(slugify('  A Hora da Estrela! '), 'a-hora-da-estrela');
assert.equal(slugify('Memórias Póstumas de Brás Cubas'), 'memorias-postumas-de-bras-cubas');

// cadastro exige licença e prova da licença
const book = { title: 'Dom Casmurro', author: 'Machado de Assis', year: 1899, description: '', license: 'public_domain', licenseNote: 'Autor falecido em 1908; domínio público.', text: '# I\n\nx' };
assert.equal(bookSchema.safeParse(book).success, true);
for (const patch of [{ license: 'pirata' }, { licenseNote: 'curto' }, { licenseNote: '' }, { title: 'x' }, { year: 12 }, { price: 1 }])
  assert.equal(bookSchema.safeParse({ ...book, ...patch }).success, false, JSON.stringify(patch));
const id = crypto.randomUUID();
assert.equal(bookActionSchema.safeParse({ action: 'create', book }).success, true);
assert.equal(bookActionSchema.safeParse({ action: 'publish', id }).success, true);
assert.equal(bookActionSchema.safeParse({ action: 'publish', id: 'x' }).success, false);

// leitor: a citação nunca vem do navegador
const note = { action: 'note', bookId: id, chapter: 1, paragraph: 0, body: 'minha leitura', tag: 'Memória' };
assert.equal(readerActionSchema.safeParse(note).success, true);
for (const bad of [{ ...note, quote: 'texto inventado' }, { ...note, body: '' }, { ...note, body: 'x'.repeat(2001) }, { ...note, tag: 'Outra' }, { ...note, chapter: 0 }, { ...note, paragraph: -1 }])
  assert.equal(readerActionSchema.safeParse(bad).success, false, JSON.stringify(bad));
assert.equal(readerActionSchema.safeParse({ ...note, tag: '' }).success, true);

assert.equal(
  citationMarkdown({ quote: 'Uma noite\ndestas.', author: 'Machado de Assis', title: 'Dom Casmurro', chapterTitle: 'Capítulo I', url: 'https://x.test/livros/dom-casmurro?cap=1#p1' }),
  '> Uma noite destas.\n>\n> — Machado de Assis, [Dom Casmurro](https://x.test/livros/dom-casmurro?cap=1#p1), Capítulo I\n\n',
);
console.log('Livros: capítulos, licença obrigatória, ações do leitor e citação.');
