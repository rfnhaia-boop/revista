import assert from 'node:assert/strict';
import { esc, oneLine, passwordResetMail, passwordChangedMail, inviteMail, receiptMail } from '../lib/mail-templates.ts';
import { forgotSchema, resetSchema } from '../lib/auth-validation.ts';

const co = { name: 'NEW Company', address: 'Rua X, 1', contactEmail: 'oi@new.test' };

// escape e assunto numa linha
assert.equal(esc(`<b>"a" & 'b'</b>`), '&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;');
assert.equal(oneLine('Recibo\r\nBcc: x@y.z'), 'Recibo Bcc: x@y.z');

// reset: link e prazo aparecem, nome malicioso é escapado
const reset = passwordResetMail(co, { name: '<img src=x onerror=1>', link: 'https://x.test/redefinir-senha?token=abc', minutes: 60 });
assert.ok(reset.html.includes('https://x.test/redefinir-senha?token=abc') && reset.text.includes('60 minutos'));
assert.equal(reset.html.includes('<img src=x'), false);
assert.ok(passwordChangedMail(co, { name: 'Ana' }).text.includes('oi@new.test'));

// convite: mensagem do admin é escapada e entra no texto
const inv = inviteMail(co, { name: 'Ana', role: 'criador', message: '<script>alert(1)</script>', link: 'https://x.test/convite/t', expiresAt: '2026-11-01T12:00:00.000Z' });
assert.equal(inv.html.includes('<script>'), false);
assert.ok(inv.html.includes('&lt;script&gt;') && inv.text.includes('https://x.test/convite/t') && inv.text.includes('criador'));

// recibo: valor em reais, item, código, link
const rec = receiptMail(co, { name: 'Leo', item: 'Texto pago', creator: 'Ana', kind: 'single', cents: 1500, paidAt: '2026-10-17T15:00:00.000Z', paymentRef: 'AB12CD34', accessLink: 'https://x.test/textos/1' });
assert.ok(/R\$\s?15,00/.test(rec.text) && rec.text.includes('AB12CD34') && rec.subject === 'Recibo: Texto pago');
assert.ok(receiptMail(co, { name: 'Leo', item: 'Apoiador', creator: 'Ana', kind: 'subscription', cents: 990, paidAt: '2026-10-17T15:00:00.000Z', paymentRef: 'X', accessLink: 'https://x.test' }).text.includes('Assinatura mensal de Ana'));

// validação
assert.equal(forgotSchema.safeParse({ email: ' ANA@Example.com ' }).data.email, 'ana@example.com');
for (const bad of [{}, { email: 'x' }, { email: 'a@b.com', extra: 1 }]) assert.equal(forgotSchema.safeParse(bad).success, false);
const tk = 'a'.repeat(40);
assert.equal(resetSchema.safeParse({ token: tk, password: 'senha-forte-1', confirmPassword: 'senha-forte-1' }).success, true);
for (const bad of [{ token: tk, password: 'curta', confirmPassword: 'curta' }, { token: tk, password: 'senha-forte-1', confirmPassword: 'outra-senha-1' }, { token: 'x', password: 'senha-forte-1', confirmPassword: 'senha-forte-1' }])
  assert.equal(resetSchema.safeParse(bad).success, false);
console.log('Mail: modelos escapam HTML, assunto em uma linha, validação de recuperação.');
