import assert from 'node:assert/strict';
import { isCpfCnpj, payoutSchema, planSchema } from '../lib/payout-validation.ts';

for (const ok of ['529.982.247-25', '52998224725', '11.222.333/0001-81']) assert.equal(isCpfCnpj(ok.replace(/\D/g, '')), true, ok);
for (const bad of ['52998224724', '11111111111', '00000000000000', '123', '']) assert.equal(isCpfCnpj(bad), false, bad);

const base = { name: 'Ana Autora', cpfCnpj: '529.982.247-25', birthDate: '1990-05-10', mobilePhone: '(11) 91234-5678', incomeValue: 3000, postalCode: '13201-000', address: 'Rua das Flores', addressNumber: '10', province: 'Centro', consent: true };
const r = payoutSchema.safeParse(base);
assert.equal(r.success, true);
assert.equal(r.data.cpfCnpj, '52998224725'); // normalizado
assert.equal(r.data.postalCode, '13201000');
for (const patch of [{ cpfCnpj: '111.111.111-11' }, { consent: false }, { birthDate: undefined }, { birthDate: '2015-01-01' }, { mobilePhone: '123' }, { postalCode: '123' }, { incomeValue: -1 }, { ownerId: 'x' }])
  assert.equal(payoutSchema.safeParse({ ...base, ...patch }).success, false, JSON.stringify(patch));
// CNPJ não exige data de nascimento
assert.equal(payoutSchema.safeParse({ ...base, cpfCnpj: '11.222.333/0001-81', birthDate: undefined }).success, true);

assert.equal(planSchema.safeParse({ name: 'Apoiador', priceCents: 990 }).success, true);
for (const bad of [{ name: 'ab', priceCents: 990 }, { name: 'Apoiador', priceCents: 499 }, { name: 'Apoiador', priceCents: 100001 }, { name: 'Apoiador', priceCents: 9.9 }, { name: 'Apoiador', priceCents: 990, ownerId: 'x' }])
  assert.equal(planSchema.safeParse(bad).success, false, JSON.stringify(bad));
console.log('Payout: CPF/CNPJ, dados da subconta e limites do plano validados.');
