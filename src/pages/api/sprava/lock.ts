import type { APIRoute } from "astro";
import { getDb, schema } from "../../../db";
import { jsonError, jsonOk, parseJsonBody } from "../../../lib/admin-helpers";

export const prerender = false;

// Zamknutí/odemknutí webu (zobrazí jen úvodní fotku + text). Ukládá do site_texts.
export const POST: APIRoute = async ({ request }) => {
  const body = await parseJsonBody<{ locked?: unknown; text?: unknown }>(request);
  if (!body) return jsonError("Neplatná data.");
  const locked = body.locked ? "1" : "";
  const text = typeof body.text === "string" ? body.text : "";

  const db = await getDb();
  for (const [key, value] of [
    ["site_locked", locked],
    ["lock_text", text],
  ] as const) {
    await db
      .insert(schema.siteTexts)
      .values({ key, value })
      .onConflictDoUpdate({ target: schema.siteTexts.key, set: { value } });
  }
  return jsonOk({ locked: !!locked });
};
