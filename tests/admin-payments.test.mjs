import assert from 'node:assert/strict';
import { paymentsActionSchema } from '../lib/admin-validation.ts';

const id = crypto.randomUUID();
for (const ok of [
  { action: 'refund', paymentId: id, note: '' },
  { action: 'refund', paymentId: id },
  { action: 'block-creator', ownerId: 'u1', reason: 'Suspeita de fraude', cancelSubscriptions: true },
  { action: 'unblock-creator', ownerId: 'u1' },
]) assert.equal(paymentsActionSchema.safeParse(ok).success, true, JSON.stringify(ok));
for (const bad of [
  { action: 'refund', paymentId: 'x' },
  { action: 'refund', paymentId: id, amountCents: 1 }, // valor do estorno nunca vem do navegador
  { action: 'block-creator', ownerId: 'u1', reason: 'x', cancelSubscriptions: true },
  { action: 'block-creator', ownerId: 'u1', reason: 'Motivo válido' }, // exige decidir sobre as assinaturas
  { action: 'unblock-creator' },
  { action: 'transfer', ownerId: 'u1' },
]) assert.equal(paymentsActionSchema.safeParse(bad).success, false, JSON.stringify(bad));
console.log('Admin pagamentos: ações estritas (estorno total, bloqueio com motivo).');
