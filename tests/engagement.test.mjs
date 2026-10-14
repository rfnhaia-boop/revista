import assert from 'node:assert/strict';
import { cleanReply, engageSchema, viewerKey, brDay, REPLY_MAX } from '../lib/engagement.ts';

const id = crypto.randomUUID();
// ações válidas
for (const ok of [
  { action: 'view', postId: id }, { action: 'react', postId: id, enabled: true },
  { action: 'reply', postId: id, body: 'oi' }, { action: 'hide-reply', replyId: id, hidden: true },
  { action: 'mark-seen', postId: id },
]) assert.equal(engageSchema.safeParse(ok).success, true, JSON.stringify(ok));
// campos extras, ids inválidos e ações desconhecidas são recusados
for (const bad of [
  { action: 'view', postId: 'x' }, { action: 'view', postId: id, owner: 'a' }, { action: 'delete', postId: id },
  { action: 'react', postId: id }, { action: 'reply', postId: id },
]) assert.equal(engageSchema.safeParse(bad).success, false, JSON.stringify(bad));

// resposta é texto puro, normalizado e limitado
assert.equal(cleanReply('  Olá   mundo \r\n\r\n\r\n\r\nfim ').text, 'Olá mundo \n\nfim');
assert.equal(cleanReply('<b>oi</b>').text, '<b>oi</b>'); // não interpreta HTML; a tela escapa
assert.ok(cleanReply('a').error);
assert.ok(cleanReply('   ').error);
assert.ok(cleanReply('x'.repeat(REPLY_MAX + 1)).error);
assert.equal(cleanReply('x'.repeat(REPLY_MAX)).text.length, REPLY_MAX);
assert.equal(cleanReply('oi‮tudo').text, 'oitudo'); // remove caracteres de direção invisíveis

// chave do leitor: estável, anônima e diferente por pessoa
const a = viewerKey(null, '1.1.1.1', 'NavA');
assert.equal(a, viewerKey(null, '1.1.1.1', 'NavA'));
assert.notEqual(a, viewerKey(null, '1.1.1.1', 'NavB'));
assert.notEqual(a, viewerKey('user-1', '1.1.1.1', 'NavA'));
assert.match(a, /^[0-9a-f]{32}$/);
assert.ok(!a.includes('1.1.1.1'));

// dia em Brasília (UTC-3)
assert.equal(brDay(new Date('2026-10-14T02:30:00Z')), '2026-10-13');
assert.equal(brDay(new Date('2026-10-14T03:00:00Z')), '2026-10-14');
console.log('Engagement: schema, reply sanitising, anonymous viewer key, São Paulo day.');

import { delta } from '../lib/engagement.ts';
assert.deepEqual(delta(0, 0), { text: '–', tone: 'flat' });
assert.deepEqual(delta(5, 0), { text: 'novo', tone: 'new' });
assert.deepEqual(delta(12, 10), { text: '+20%', tone: 'up' });
assert.deepEqual(delta(5, 10), { text: '-50%', tone: 'down' });
assert.deepEqual(delta(10, 10), { text: 'igual', tone: 'flat' });
