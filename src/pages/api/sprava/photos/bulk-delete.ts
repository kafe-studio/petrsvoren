import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { inArray } from "drizzle-orm";
import { getDb, schema } from "../../../../db";
import { jsonError, jsonOk, parseJsonBody } from "../../../../lib/admin-helpers";

export const prerender = false;

// Hromadné smazání fotek (R2 originály + D1 řádky; cascade smaže zařazení).
export const POST: APIRoute = async ({ request }) => {
  const body = await parseJsonBody<{ ids?: unknown }>(request);
  if (!body || !Array.isArray(body.ids)) return jsonError("Chybí seznam id.");
  const ids = body.ids.filter((x): x is string => typeof x === "string");
  if (ids.length === 0) return jsonError("Nic k smazání.");

  const db = await getDb();
  const rows = await db
    .select({ key: schema.photos.r2Key })
    .from(schema.photos)
    .where(inArray(schema.photos.id, ids));

  const keys = rows.map((r) => r.key);
  if (keys.length > 0) {
    try {
      await env.PHOTOS.delete(keys); // R2 binding umí smazat pole klíčů najednou
    } catch {
      /* selhání R2 nebrání smazání DB řádků */
    }
  }
  await db.delete(schema.photos).where(inArray(schema.photos.id, ids));
  return jsonOk({ deleted: ids.length });
};
