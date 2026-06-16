import type { APIRoute } from "astro";
import { getDb, schema } from "../../../db";
import { jsonError, jsonOk, parseJsonBody } from "../../../lib/admin-helpers";
import { TEXT_KEYS } from "../../../lib/site-text-fields";

export const prerender = false;

// Hromadný upsert editovatelných textů webu (site_texts). Přijímá jen známé klíče.
export const POST: APIRoute = async ({ request }) => {
  const body = await parseJsonBody<{ texts?: Record<string, unknown> }>(request);
  if (!body || typeof body.texts !== "object" || body.texts === null) {
    return jsonError("Neplatná data.");
  }
  const db = await getDb();
  const entries = Object.entries(body.texts).filter(([k]) =>
    TEXT_KEYS.includes(k),
  );
  for (const [key, raw] of entries) {
    const value = typeof raw === "string" ? raw : "";
    await db
      .insert(schema.siteTexts)
      .values({ key, value })
      .onConflictDoUpdate({ target: schema.siteTexts.key, set: { value } });
  }
  return jsonOk({ saved: entries.length });
};
