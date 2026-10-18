import assert from 'node:assert/strict';
import { forYou, unlockedFor, SUBSCRIBED_BOOST_DAYS } from '../lib/feed.ts';

const day = (n) => new Date(Date.UTC(2026, 9, 17) - n * 86_400_000).toISOString();
const E = (id, daysAgo, profileId, paid = false) => ({ id, date: day(daysAgo), profileId, paid });
const ctx = (o = {}) => ({ subscribed: new Set(), following: new Set(), purchased: new Set(), ...o });

// aberto entra, pago de quem não assino fica de fora
const base = [E('a-free', 1, 'A'), E('a-paid', 2, 'A', true), E('b-free', 3, 'B'), E('b-paid', 4, 'B', true)];
assert.deepEqual(forYou(base, ctx()).map((e) => e.id), ['a-free', 'b-free']);
// assino A: o pago de A aparece; o de B continua de fora
assert.deepEqual(forYou(base, ctx({ subscribed: new Set(['A']) })).map((e) => e.id), ['a-free', 'a-paid', 'b-free']);
// comprei um texto avulso: só aquele
assert.deepEqual(forYou(base, ctx({ purchased: new Set(['b-paid']) })).map((e) => e.id), ['a-free', 'b-free', 'b-paid']);
// assinado sobe (até 14 dias de empurrão), seguido sobe menos
const old = [E('novo-b', 1, 'B'), E('velho-a', 10, 'A')];
assert.deepEqual(forYou(old, ctx({ subscribed: new Set(['A']) })).map((e) => e.id), ['velho-a', 'novo-b']);
assert.deepEqual(forYou(old, ctx({ following: new Set(['A']) })).map((e) => e.id), ['novo-b', 'velho-a']); // 3 dias não vencem 9 de diferença
assert.deepEqual(forYou([E('x', 4, 'A'), E('y', 1, 'B')], ctx({ following: new Set(['A']) })).map((e) => e.id), ['x', 'y']);
// além do empurrão, a data volta a mandar
assert.deepEqual(forYou([E('muito-velho', SUBSCRIBED_BOOST_DAYS + 5, 'A'), E('novo', 1, 'B')], ctx({ subscribed: new Set(['A']) })).map((e) => e.id), ['novo', 'muito-velho']);
// artigo da equipe (sem perfil) segue a data e não é pago
assert.deepEqual(forYou([E('art', 0, null), E('a-free', 1, 'A')], ctx()).map((e) => e.id), ['art', 'a-free']);
// não altera a lista original
const copy = [...base]; forYou(base, ctx()); assert.deepEqual(base, copy);
// unlockedFor
assert.equal(unlockedFor({ id: 'p', profileId: 'A' }, { subscribed: new Set(['A']), purchased: new Set() }), true);
assert.equal(unlockedFor({ id: 'p', profileId: 'B' }, { subscribed: new Set(['A']), purchased: new Set() }), false);
assert.equal(unlockedFor({ id: 'p', profileId: null }, { subscribed: new Set(['A']), purchased: new Set(['p']) }), true);
console.log('Feed: aberto + assinados, pago alheio fora, empurrão por assinatura/seguir.');
