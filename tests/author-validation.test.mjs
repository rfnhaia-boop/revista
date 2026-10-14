import assert from 'node:assert/strict';
import { authorArticleSchema, validateForSubmit, slugify, readingMinutes, MIN_BODY_CHARS } from '../lib/author-validation.ts';

const base = {
  action: 'save', title: 'Um título', summary: 'Um resumo com mais de vinte caracteres.', area: 'Educação',
  kind: 'Ensaio', authorName: 'Paulo', body: 'texto', referencesText: '',
};
assert.equal(authorArticleSchema.safeParse(base).success, true);
// área é livre (texto), mas limitada
assert.equal(authorArticleSchema.safeParse({ ...base, area: 'Educação e aprendizagem' }).success, true);
assert.equal(authorArticleSchema.safeParse({ ...base, area: 'x'.repeat(61) }).success, false);
// campos privilegiados e ações inválidas são rejeitados
for (const patch of [{ status: 'published' }, { authorId: 'outro' }, { action: 'publish' }, { kind: 'Livro' }, { body: 'x'.repeat(60001) }])
  assert.equal(authorArticleSchema.safeParse({ ...base, ...patch }).success, false, JSON.stringify(patch));

// regras só do envio para revisão
const ok = { ...base, action: 'submit', title: 'Título válido', body: 'palavra '.repeat(200) };
assert.equal(validateForSubmit(ok), null);
assert.ok(validateForSubmit({ ...ok, body: 'curto' })?.includes(String(MIN_BODY_CHARS)));
assert.ok(validateForSubmit({ ...ok, title: 'Oi' }));
assert.ok(validateForSubmit({ ...ok, summary: 'curto' }));
assert.ok(validateForSubmit({ ...ok, area: '' }));

assert.equal(slugify('Ação, Emoção & Mente!'), 'acao-emocao-mente');
assert.equal(readingMinutes('palavra '.repeat(450)), 3);
assert.equal(readingMinutes(''), 1);
console.log('Author article schema: free area, strict fields, submit-time rules, slug and reading time.');
