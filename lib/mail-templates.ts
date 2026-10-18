/** Modelos de e-mail. Funções puras: recebem os dados e devolvem assunto, HTML e texto. */

export type MailCompany = { name: string; address: string; contactEmail: string };
export type Mail = { subject: string; html: string; text: string };

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Assunto numa linha só: sem quebras (evita injeção de cabeçalhos). */
export const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim().slice(0, 200);

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const day = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });

function layout(co: MailCompany, title: string, bodyHtml: string, preheader: string) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f4f1f8;font-family:Arial,Helvetica,sans-serif;color:#241f2b">
<span style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1f8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden">
<tr><td style="background:#100c15;padding:22px 28px;color:#f6f0ff;font:22px Georgia,serif">Revista NEW<span style="color:#b17bfa">.</span></td></tr>
<tr><td style="padding:28px;font-size:16px;line-height:1.6">${bodyHtml}</td></tr>
<tr><td style="padding:18px 28px;background:#faf8fd;color:#7b7088;font-size:12px;line-height:1.5">${esc(co.name)} · ${esc(co.address)}<br>Dúvidas? Escreva para ${esc(co.contactEmail)}</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:26px 0"><a href="${esc(href)}" style="background:#8f4fd6;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:10px;display:inline-block;font-weight:bold">${esc(label)}</a></p>
<p style="font-size:13px;color:#7b7088">Se o botão não abrir, copie este endereço no navegador:<br><span style="word-break:break-all">${esc(href)}</span></p>`;

export function passwordResetMail(co: MailCompany, d: { name: string; link: string; minutes: number }): Mail {
  const subject = "Redefinir sua senha na Revista NEW";
  const html = layout(
    co,
    subject,
    `<p>Olá, ${esc(d.name)}.</p><p>Recebemos um pedido para redefinir a senha da sua conta. O link vale por ${d.minutes} minutos e só funciona uma vez.</p>${button(d.link, "Criar nova senha")}<p style="font-size:14px">Se você não pediu isso, ignore este e-mail: sua senha continua a mesma.</p>`,
    "Link para criar uma nova senha.",
  );
  const text = `Olá, ${d.name}.\n\nRecebemos um pedido para redefinir a senha da sua conta. O link vale por ${d.minutes} minutos e só funciona uma vez:\n${d.link}\n\nSe você não pediu isso, ignore este e-mail: sua senha continua a mesma.\n\n${co.name}`;
  return { subject, html, text };
}

export function passwordChangedMail(co: MailCompany, d: { name: string }): Mail {
  const subject = "Sua senha da Revista NEW foi alterada";
  const html = layout(
    co,
    subject,
    `<p>Olá, ${esc(d.name)}.</p><p>A senha da sua conta acabou de ser alterada e você foi desconectado dos outros aparelhos.</p><p style="font-size:14px">Não foi você? Escreva para ${esc(co.contactEmail)} agora mesmo.</p>`,
    "A senha da sua conta foi alterada.",
  );
  const text = `Olá, ${d.name}.\n\nA senha da sua conta acabou de ser alterada e você foi desconectado dos outros aparelhos.\nNão foi você? Escreva para ${co.contactEmail} agora mesmo.\n\n${co.name}`;
  return { subject, html, text };
}

export function inviteMail(co: MailCompany, d: { name: string; role: string; message: string; link: string; expiresAt: string }): Mail {
  const subject = "Você foi convidado para a Revista NEW";
  const note = d.message ? `<blockquote style="margin:18px 0;padding:12px 16px;border-left:3px solid #b17bfa;background:#faf8fd;color:#4a4256">${esc(d.message)}</blockquote>` : "";
  const html = layout(
    co,
    subject,
    `<p>Olá, ${esc(d.name)}.</p><p>A equipe da Revista NEW convidou você para participar como <strong>${esc(d.role)}</strong>: escrever, publicar e conversar com leitores num Caderno só seu.</p>${note}${button(d.link, "Aceitar convite")}<p style="font-size:14px">O convite é pessoal e vale até ${esc(day(d.expiresAt))}.</p>`,
    "Seu convite pessoal para a Revista NEW.",
  );
  const text = `Olá, ${d.name}.\n\nA equipe da Revista NEW convidou você para participar como ${d.role}: escrever, publicar e conversar com leitores num Caderno só seu.\n${d.message ? `\n"${d.message}"\n` : ""}\nAceitar o convite: ${d.link}\n\nO convite é pessoal e vale até ${day(d.expiresAt)}.\n\n${co.name}`;
  return { subject, html, text };
}

export function receiptMail(co: MailCompany, d: { name: string; item: string; creator: string; kind: "single" | "subscription"; cents: number; paidAt: string; paymentRef: string; accessLink: string }): Mail {
  const subject = `Recibo: ${oneLine(d.item)}`;
  const what = d.kind === "subscription" ? `Assinatura mensal de ${d.creator}` : `${d.item}, de ${d.creator}`;
  const rows = [["Item", what], ["Valor", brl(d.cents)], ["Pago em", day(d.paidAt)], ["Código", d.paymentRef]];
  const table = rows.map(([k, v]) => `<tr><td style="padding:6px 0;color:#7b7088;width:90px">${esc(k)}</td><td style="padding:6px 0">${esc(v)}</td></tr>`).join("");
  const html = layout(
    co,
    subject,
    `<p>Olá, ${esc(d.name)}.</p><p>Recebemos o seu pagamento. O acesso já está liberado.</p><table role="presentation" style="width:100%;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:14px 0">${table}</table>${button(d.accessLink, "Ler agora")}<p style="font-size:13px;color:#7b7088">Este e-mail é o comprovante da sua compra. Direito de arrependimento em até 7 dias: responda a este e-mail.</p>`,
    "Recebemos o seu pagamento.",
  );
  const text = `Olá, ${d.name}.\n\nRecebemos o seu pagamento. O acesso já está liberado.\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nLer agora: ${d.accessLink}\n\nEste e-mail é o comprovante da sua compra. Direito de arrependimento em até 7 dias: responda a este e-mail.\n\n${co.name}`;
  return { subject, html, text };
}
