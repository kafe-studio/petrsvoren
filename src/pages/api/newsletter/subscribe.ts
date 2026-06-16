import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../db";
import { jsonError, jsonOk } from "../../../lib/admin-helpers";
import { verifyTurnstile } from "../../../lib/turnstile";

export const prerender = false;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Přihlášení k odběru novinek (veřejné). Idempotentní — duplicitu tiše přijme.
export const POST: APIRoute = async ({ request }) => {
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
  const exists = await db
    .select({ id: schema.subscribers.id })
    .from(schema.subscribers)
    .where(eq(schema.subscribers.email, email))
    .get();
  if (!exists) {
    const unsubscribeToken =
      crypto.randomUUID().replace(/-/g, "") +
      crypto.randomUUID().replace(/-/g, "");
    await db
      .insert(schema.subscribers)
      .values({ id: crypto.randomUUID(), email, unsubscribeToken });
  }
  return jsonOk({ subscribed: true });
};
