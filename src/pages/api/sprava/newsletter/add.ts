import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../../db";
import { jsonError, jsonOk, parseJsonBody } from "../../../../lib/admin-helpers";

export const prerender = false;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Ruční přidání odběratele z adminu (bez Turnstile — je za přihlášením).
export const POST: APIRoute = async ({ request }) => {
  const body = await parseJsonBody<{ email?: unknown }>(request);
  const email =
    body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) return jsonError("Zadej platný e-mail.");

  const db = await getDb();
  const exists = await db
    .select({ id: schema.subscribers.id })
    .from(schema.subscribers)
    .where(eq(schema.subscribers.email, email))
    .get();
  if (exists) return jsonError("Tento e-mail už odebírá.", 409);

  const unsubscribeToken =
    crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  // Ručně přidaný adresát z adminu je rovnou potvrzený (bez double opt-inu).
  await db
    .insert(schema.subscribers)
    .values({ id: crypto.randomUUID(), email, unsubscribeToken, confirmed: true });
  return jsonOk({ email }, 201);
};
