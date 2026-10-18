import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { company } from "@/lib/legal";
import { oneLine, type Mail, type MailCompany } from "@/lib/mail-templates";
import { database } from "@/lib/storage";

export const mailCompany = (): MailCompany => {
  const c = company();
  return { name: c.name, address: c.address, contactEmail: c.contactEmail };
};

const EMAIL = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;

/**
 * Provedores:
 *  - resend: produção (RESEND_API_KEY + MAIL_FROM)
 *  - file:   desenvolvimento, grava o e-mail em .mail-outbox/ (nunca em produção)
 *  - off:    não envia (padrão sem configuração); a ação do usuário não quebra
 */
function provider() {
  const p = process.env.MAIL_PROVIDER || (process.env.RESEND_API_KEY ? "resend" : "off");
  if (p === "file" && process.env.NODE_ENV === "production") return "off";
  return p;
}

async function record(to: string, template: string, status: "sent" | "failed" | "skipped", error = "") {
  try {
    // Só destinatário, modelo e resultado: nunca o corpo (tem links com token).
    await database()
      .prepare("INSERT INTO email_log (id,to_email,template,status,error,created_at) VALUES (?,?,?,?,?,?)")
      .bind(crypto.randomUUID(), to, template, status, error.slice(0, 300), new Date().toISOString())
      .run();
  } catch {
    /* o log nunca derruba o fluxo */
  }
}

/** Envia um e-mail. Nunca lança: devolve true se foi aceito pelo provedor. */
export async function sendMail(to: string, template: string, mail: Mail): Promise<boolean> {
  if (!EMAIL.test(to) || to.length > 200) {
    await record(to.slice(0, 200), template, "failed", "destinatário inválido");
    return false;
  }
  const subject = oneLine(mail.subject);
  const p = provider();
  try {
    if (p === "resend") {
      const key = process.env.RESEND_API_KEY;
      const from = process.env.MAIL_FROM;
      if (!key || !from) throw new Error("RESEND_API_KEY ou MAIL_FROM ausente");
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject, html: mail.html, text: mail.text, ...(process.env.MAIL_REPLY_TO ? { reply_to: process.env.MAIL_REPLY_TO } : {}) }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`provedor respondeu ${res.status}`);
    } else if (p === "file") {
      const dir = join(process.cwd(), ".mail-outbox");
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.json`), JSON.stringify({ to, subject, text: mail.text, html: mail.html }, null, 2));
    } else {
      await record(to, template, "skipped", "envio de e-mail desligado");
      return false;
    }
    await record(to, template, "sent");
    return true;
  } catch (e) {
    await record(to, template, "failed", e instanceof Error ? e.message : "erro");
    return false;
  }
}
