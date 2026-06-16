import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../../db";
import { jsonError, jsonOk } from "../../../../lib/admin-helpers";

export const prerender = false;

// Odebrání odběratele ze seznamu.
export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id ?? "";
  if (!id) return jsonError("Chybí id.");
  const db = await getDb();
  await db.delete(schema.subscribers).where(eq(schema.subscribers.id, id));
  return jsonOk();
};
