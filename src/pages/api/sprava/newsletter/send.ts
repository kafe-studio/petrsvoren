import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../../db";
import { jsonError, jsonOk } from "../../../../lib/admin-helpers";
import { sendEmail, mailFrom } from "../../../../lib/email";

export const prerender = false;

// Rozeslání newsletteru potvrzeným odběratelům. Tělo je HTML (rich editor).
// Každý e-mail má vlastní odhlašovací odkaz. Po dávkách kvůli subrequest limitu.
export const POST: APIRoute = async ({ request, url }) => {
  let body: { subject?: unknown; body?: unknown };
  try {
    body = (await request.json()) as { subject?: unknown; body?: unknown };
  } catch {
    return jsonError("Neplatná data.");
  }
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const contentHtml = typeof body.body === "string" ? body.body : "";
  if (!subject) return jsonError("Předmět je povinný.");
  if (!contentHtml.trim()) return jsonError("Text e-mailu je povinný.");

  const db = await getDb();
  // Jen potvrzení odběratelé (double opt-in).
  const subs = await db
    .select()
    .from(schema.subscribers)
    .where(eq(schema.subscribers.confirmed, true));
  if (subs.length === 0) return jsonError("Žádní potvrzení odběratelé.", 400);

  const from = await mailFrom();

  let sent = 0;
  let failed = 0;
  let firstError = "";
  // Po dávkách, ať nepřetížíme subrequest limit Workeru.
  const CHUNK = 20;
  for (let i = 0; i < subs.length; i += CHUNK) {
    const chunk = subs.slice(i, i + CHUNK);
    const results = await Promise.allSettled(
      chunk.map((s) => {
        const unsub = `${url.origin}/odhlasit/?token=${s.unsubscribeToken}`;
        const html = `${contentHtml}
          <hr style="margin-top:32px;border:none;border-top:1px solid #ddd" />
          <p style="font-size:12px;color:#888">
            Tento e-mail jsi dostal(a), protože odebíráš novinky z petrsvoren.
            <a href="${unsub}">Odhlásit odběr</a>.
          </p>`;
        return sendEmail({ to: s.email, subject, html, from });
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.ok) sent++;
      else {
        failed++;
        if (!firstError) {
          firstError =
            r.status === "fulfilled"
              ? (r.value.error ?? "")
              : String(r.reason);
        }
      }
    }
  }

  return jsonOk({ sent, failed, total: subs.length, firstError });
};
