import assert from 'node:assert/strict';
import { checkoutSchema, commissionPercent, splitOf, cancelSchema } from '../lib/checkout-validation.ts';

const id = crypto.randomUUID();
const base = { cpfCnpj: '529.982.247-25', consent: true };
assert.equal(checkoutSchema.safeParse({ type: 'single', notebookId: id, ...base }).success, true);
assert.equal(checkoutSchema.safeParse({ type: 'subscription', planId: id, ...base }).success, true);
// o preço nunca vem do navegador; campos extras, ids ruins e CPF inválido são recusados
for (const bad of [
  { type: 'single', notebookId: id, ...base, priceCents: 1 },
  { type: 'single', notebookId: 'x', ...base },
  { type: 'single', notebookId: id, cpfCnpj: '111.111.111-11', consent: true },
  { type: 'single', notebookId: id, cpfCnpj: base.cpfCnpj, consent: false },
  { type: 'subscription', planId: id, ...base, notebookId: id },
  { type: 'refund', notebookId: id, ...base },
]) assert.equal(checkoutSchema.safeParse(bad).success, false, JSON.stringify(bad));
assert.equal(cancelSchema.safeParse({ id }).success, true);
assert.equal(cancelSchema.safeParse({ id, extra: 1 }).success, false);

// comissão: padrão 10, limitada a 0-50, lixo cai no padrão
assert.equal(commissionPercent(undefined), 10);
assert.equal(commissionPercent('15'), 15);
assert.equal(commissionPercent('90'), 50);
assert.equal(commissionPercent('-5'), 0);
assert.equal(commissionPercent('abc'), 10);
assert.deepEqual(splitOf(1500, 10), { commissionCents: 150, creatorPercent: 90 });
assert.deepEqual(splitOf(990, 10), { commissionCents: 99, creatorPercent: 90 });
console.log('Checkout: payload estrito, CPF validado, comissão e split corretos.');
