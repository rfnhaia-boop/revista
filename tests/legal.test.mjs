import assert from 'node:assert/strict';
import { activateSchema } from '../lib/auth-validation.ts';
import { LEGAL_VERSION } from '../lib/legal.ts';

assert.match(LEGAL_VERSION, /^\d{4}-\d{2}-\d{2}$/);
const ok = { codigo: 'ABCD-1234', email: 'ana@example.com', terms: true };
assert.equal(activateSchema.safeParse(ok).success, true);
// sem aceite dos Termos não ativa conta
assert.equal(activateSchema.safeParse({ codigo: ok.codigo, email: ok.email }).success, false);
assert.equal(activateSchema.safeParse({ ...ok, terms: false }).success, false);
assert.equal(activateSchema.safeParse({ ...ok, extra: 1 }).success, false);
console.log('Legal: ativação exige aceite dos Termos; versão vigente no formato AAAA-MM-DD.');
