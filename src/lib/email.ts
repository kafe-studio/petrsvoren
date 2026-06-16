// Odesílání e-mailů přes Resend REST API. Klíč = Workers secret RESEND_API_KEY.
// Odesílací adresa (from) je konfigurovatelná v adminu (site_texts: mail_from);
// dokud nemáš v Resendu ověřenou doménu, funguje jen onboarding@resend.dev
// (a to pouze na e-mail majitele účtu).
import { env } from "cloudflare:workers";
import { getTexts, txt } from "./content";

export const DEFAULT_FROM = "Petr Svoreň <onboarding@resend.dev>";

export async function mailFrom(): Promise<string> {
  try {
    const texts = await getTexts();
    return txt(texts, "mail_from", DEFAULT_FROM);
  } catch {
    return DEFAULT_FROM;
  }
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}): Promise<SendResult> {
  const key = env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY není nastaven." };
  const from = opts.from ?? (await mailFrom());
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, error: `Resend ${res.status}: ${t.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Odeslání selhalo." };
  }
}
