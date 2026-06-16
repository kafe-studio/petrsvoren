import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../db";
import { jsonError, jsonOk } from "../../../lib/admin-helpers";
import { verifyTurnstile } from "../../../lib/turnstile";
import { sendEmail } from "../../../lib/email";

export const prerender = false;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const genToken = () =>
  crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

// Přihlášení k odběru novinek (veřejné) s double opt-inem: po registraci
// pošleme potvrzovací odkaz; odběratel je aktivní až po jeho potvrzení.
export const POST: APIRoute = async ({ request, url }) => {
  let body: { email?: unknown; turnstileToken?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; turnstileToken?: unknown };
  } catch {
    return jsonError("Neplatná data.");
  }
  const tsToken =
    typeof body.turnstileToken === "string" ? body.turnstileToken : undefined;
  if (!(await verifyTurnstile(tsToken, request.headers.get("cf-connecting-ip")))) {
    return jsonError("Ověření proti robotům selhalo, zkus to znovu.", 403);
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) return jsonError("Zadej platný e-mail.");

  const db = await getDb();
  const existing = await db
    .select()
    .from(schema.subscribers)
    .where(eq(schema.subscribers.email, email))
    .get();

  // Už potvrzeno → nic neposílej.
  if (existing?.confirmed) {
    return jsonOk({ status: "already" });
  }

  // Nový nebo nepotvrzený → (vlož a) pošli potvrzovací odkaz.
  const token = existing?.unsubscribeToken ?? genToken();
  if (!existing) {
    await db.insert(schema.subscribers).values({
      id: crypto.randomUUID(),
      email,
      unsubscribeToken: token,
      confirmed: false,
    });
  }

  const link = `${url.origin}/newsletter/potvrdit/?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Potvrď odběr novinek – Petr Svoreň",
    html: `
      <p>Ahoj,</p>
      <p>potvrď prosím odběr novinek z webu Petr Svoreň kliknutím na odkaz:</p>
      <p><a href="${link}">Potvrdit odběr</a></p>
      <p>Pokud jsi o odběr nežádal(a), tento e-mail ignoruj.</p>
    `,
  });

  return jsonOk({ status: "pending" });
};
