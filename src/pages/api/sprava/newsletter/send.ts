import type { APIRoute } from "astro";
import { marked } from "marked";
import { getDb, schema } from "../../../../db";
import { jsonError, jsonOk } from "../../../../lib/admin-helpers";
import { sendEmail, mailFrom } from "../../../../lib/email";

export const prerender = false;

// Rozeslání newsletteru všem odběratelům. Každý e-mail má vlastní odhlašovací
// odkaz. Posílá se po jednom (malé seznamy); u velkých lze později dávkovat.
export const POST: APIRoute = async ({ request, url }) => {
  let body: { subject?: unknown; body?: unknown };
  try {
    body = (await request.json()) as { subject?: unknown; body?: unknown };
  } catch {
    return jsonError("Neplatná data.");
  }
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const md = typeof body.body === "string" ? body.body : "";
  if (!subject) return jsonError("Předmět je povinný.");
  if (!md.trim()) return jsonError("Text e-mailu je povinný.");

  const db = await getDb();
  const subs = await db.select().from(schema.subscribers);
  if (subs.length === 0) return jsonError("Žádní odběratelé.", 400);

  const from = await mailFrom();
  const contentHtml = marked.parse(md, { async: false }) as string;

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
