import type { APIRoute } from "astro";
import { inArray } from "drizzle-orm";
import { getDb, schema } from "../../../../db";
import { jsonError, jsonOk, parseJsonBody } from "../../../../lib/admin-helpers";

export const prerender = false;

// Hromadné skrytí/zobrazení fotek (hidden = nezobrazí se na webu, ale zůstane v DB/R2).
export const POST: APIRoute = async ({ request }) => {
  const body = await parseJsonBody<{ ids?: unknown; hidden?: unknown }>(request);
  if (!body || !Array.isArray(body.ids)) return jsonError("Chybí seznam id.");
  const ids = body.ids.filter((x): x is string => typeof x === "string");
  if (ids.length === 0) return jsonError("Nic k úpravě.");
  const hidden = Boolean(body.hidden);

  const db = await getDb();
  await db
    .update(schema.photos)
    .set({ hidden })
    .where(inArray(schema.photos.id, ids));
  return jsonOk({ updated: ids.length, hidden });
};
