import assert from 'node:assert/strict';
import { SLUG_RE, slugFromName, profileErrors } from '../lib/profile-validation.ts';

// endereço gerado a partir do nome
assert.equal(slugFromName('Rafael Nhaia'), 'rafael-nhaia');
assert.equal(slugFromName('  Ação & Emoção!  '), 'acao-emocao');
assert.equal(slugFromName('123 Maria'), 'maria'); // precisa começar por letra
assert.equal(slugFromName('---'), '');
assert.ok(slugFromName('a'.repeat(80)).length <= 40);
for (const s of ['rafael', 'rafael-nhaia', 'ab1']) assert.ok(SLUG_RE.test(s), s);
for (const s of ['ab', '1abc', 'Rafael', 'a b', 'a_b', '-abc', 'x'.repeat(41)]) assert.ok(!SLUG_RE.test(s), s);
// o que o gerador produz sempre serve (quando não vazio e com 3+ letras)
for (const n of ['José da Silva', 'Ana Beatriz', 'Zé']) {
  const s = slugFromName(n);
  if (s.length >= 3) assert.ok(SLUG_RE.test(s), n);
}

const ok = { name: 'Rafael', slug: 'rafael', headline: '', location: '', bio: 'Escrevo sobre atenção e aprendizado.', trajectory: '', interests: ['Filosofia'], link: '' };
assert.deepEqual(profileErrors(ok), {});
assert.ok(profileErrors({ ...ok, name: 'R' }).name);
assert.ok(profileErrors({ ...ok, slug: 'Ab' }).slug);
assert.ok(profileErrors({ ...ok, bio: 'curto' }).bio);
assert.ok(profileErrors({ ...ok, interests: [] }).interests);
assert.ok(profileErrors({ ...ok, interests: ['x'.repeat(130), 'y'.repeat(130)] }).interests);
assert.equal(profileErrors({ ...ok, link: 'https://instagram.com/rafael' }).link, undefined);
for (const bad of ['http://x.com', 'instagram.com/x', 'javascript:alert(1)']) assert.ok(profileErrors({ ...ok, link: bad }).link, bad);
console.log('Profile: slug generation and form rules match the server.');
