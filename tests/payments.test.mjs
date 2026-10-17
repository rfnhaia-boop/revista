import assert from 'node:assert/strict';
import { effectOf, tokenMatches, asaasWebhookSchema } from '../lib/payments-core.ts';

for (const e of ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']) assert.equal(effectOf(e), 'paid');
for (const e of ['PAYMENT_REFUNDED', 'PAYMENT_CHARGEBACK_REQUESTED']) assert.equal(effectOf(e), 'refunded');
assert.equal(effectOf('PAYMENT_OVERDUE'), 'overdue');
for (const e of ['PAYMENT_CREATED', 'ALGO_NOVO', '']) assert.equal(effectOf(e), 'ignore');

assert.equal(tokenMatches('segredo-123', 'segredo-123'), true);
assert.equal(tokenMatches('segredo-124', 'segredo-123'), false);
assert.equal(tokenMatches('curto', 'segredo-123'), false);
assert.equal(tokenMatches(null, 'segredo-123'), false);
assert.equal(tokenMatches('qualquer', undefined), false);
assert.equal(tokenMatches('', ''), false);

assert.equal(asaasWebhookSchema.safeParse({ id: 'evt_1', event: 'PAYMENT_RECEIVED', payment: { id: 'pay_1', value: 10 } }).success, true);
for (const bad of [null, {}, { id: 'e' }, { id: '', event: 'X' }, { id: 'e', event: 'X', payment: {} }])
  assert.equal(asaasWebhookSchema.safeParse(bad).success, false, JSON.stringify(bad));
console.log('Payments: eventos mapeados, token em tempo constante, payload validado.');
