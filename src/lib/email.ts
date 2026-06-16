// Odesílání e-mailů přes Cloudflare Email Sending (binding `send_email` → env.EMAIL).
// Odesílací adresa (from) je konfigurovatelná v adminu (site_texts: mail_from);
// doména v adrese musí být onboardovaná v CF Email Sending (SPF/DKIM).
import { env } from "cloudflare:workers";
import { getTexts, txt } from "./content";

export const DEFAULT_FROM = "Petr Svoreň <noreply@petrsvoren.com>";

export async function mailFrom(): Promise<string> {
  try {
    const texts = await getTexts();
    return txt(texts, "mail_from", DEFAULT_FROM);
  } catch {
    return DEFAULT_FROM;
  }
}

// "Jméno <adresa@doména>" nebo "adresa@doména" → { email, name? }.
function parseFrom(from: string): { email: string; name?: string } {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m && m[2]) return { email: m[2].trim(), name: m[1] || undefined };
  return { email: from.trim() };
}

// Jednoduchý plain-text fallback z HTML (kvůli klientům i antispamu).
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
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
  const binding = env.EMAIL;
  if (!binding) return { ok: false, error: "Email Sending binding není dostupný." };
  const from = parseFrom(opts.from ?? (await mailFrom()));
  try {
    await binding.send({
      to: opts.to,
      from: from.name ? { email: from.email, name: from.name } : from.email,
      subject: opts.subject,
      html: opts.html,
      text: htmlToText(opts.html),
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    });
    console.log("[email] sent", { to: opts.to, subject: opts.subject });
    return { ok: true };
  } catch (e) {
    const err = e as { code?: string; message?: string };
    const error = err.code
      ? `${err.code}: ${err.message ?? ""}`.trim()
      : (err.message ?? "Odeslání selhalo.");
    console.error("[email] failed", { to: opts.to, error });
    return { ok: false, error };
  }
}
