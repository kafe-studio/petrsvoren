import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getDb, schema } from "../../../db";
import { jsonError, jsonOk } from "../../../lib/admin-helpers";

export const prerender = false;

// Vytvoření tipu (multipart: title, bodyText, link, active, volitelný obrázek).
export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Neplatný formulář.");
  }
  const title = String(form.get("title") ?? "").trim();
  if (!title) return jsonError("Nadpis je povinný.");
  const bodyText = String(form.get("bodyText") ?? "").trim() || null;
  const link = String(form.get("link") ?? "").trim() || null;
  const active = form.get("active") !== null;

  const id = crypto.randomUUID();
  let r2Key: string | null = null;
  const file = form.get("image");
  if (file instanceof File && file.size > 0 && file.type.startsWith("image/")) {
    r2Key = `tips/${id}.jpg`;
    await env.PHOTOS.put(r2Key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
  }

  const db = await getDb();
  const all = await db.select({ id: schema.tips.id }).from(schema.tips);
  await db
    .insert(schema.tips)
    .values({ id, title, bodyText, link, r2Key, active, sortOrder: all.length });
  return jsonOk({ id }, 201);
};
