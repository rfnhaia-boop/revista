import assert from 'node:assert/strict';
import {
  articleSchema, inviteSchema, requestDecisionSchema, submissionDecisionSchema, userRoleSchema,
} from '../lib/admin-validation.ts';

const article = {
  slug: 'minha-materia', title: 'Uma matéria de teste', summary: 'Resumo com mais de vinte caracteres para a matéria.',
  area: 'Sociedade', kind: 'Ensaio editorial', authorName: 'Editorial NEW', readingMinutes: 4, kicker: 'TESTE', sortOrder: 1,
  body: 'Corpo da matéria com bem mais de quarenta caracteres para passar na validação.', pullquote: '',
  referencesText: '', statusNote: 'Não revisado por pares.', versionNote: '', status: 'draft',
};
assert.equal(articleSchema.safeParse(article).success, true);
for (const patch of [
  { slug: 'Slug Inválido' }, { slug: '../admin' }, { slug: 'ab' }, { status: 'archived' }, { area: 'x' }, { area: 'y'.repeat(61) },
  { readingMinutes: 0 }, { body: 'curto' }, { ownerId: 'x' }, { publishedAt: '2020-01-01' },
]) assert.equal(articleSchema.safeParse({ ...article, ...patch }).success, false, JSON.stringify(patch));

const id = crypto.randomUUID();
assert.equal(requestDecisionSchema.safeParse({ id, decision: 'approve' }).success, true);
assert.equal(requestDecisionSchema.safeParse({ id, decision: 'approve', role: 'admin' }).success, false);
assert.equal(requestDecisionSchema.safeParse({ id, decision: 'promote' }).success, false);
assert.equal(inviteSchema.safeParse({ action: 'create', email: 'A@B.com', role: 'creator' }).success, true);
assert.equal(inviteSchema.safeParse({ action: 'create', email: 'a@b.com', role: 'admin' }).success, false);
assert.equal(submissionDecisionSchema.safeParse({ id, status: 'accepted' }).success, true);
assert.equal(submissionDecisionSchema.safeParse({ id, status: 'published' }).success, false);
assert.equal(userRoleSchema.safeParse({ userId: 'u1', role: 'editorial' }).success, true);
assert.equal(userRoleSchema.safeParse({ userId: 'u1', role: 'root' }).success, false);
console.log('Admin schemas: strict fields, role/status enums and slug rules enforced.');
