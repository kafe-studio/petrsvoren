import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../../../db";
import { jsonError, jsonOk } from "../../../../../lib/admin-helpers";

export const prerender = false;

// Nahradí originál fotky upravenou verzí (z editoru fotek). Přepíše stejný R2
// klíč a aktualizuje rozměry. /img/[id] má krátkou cache → změna se brzy projeví.
export const POST: APIRoute = async ({ params, request }) => {
  const id = params.id ?? "";
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Neplatný formulář.");
  }
  const file = form.get("image");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return jsonError("Chybí obrázek.");
  }

  const db = await getDb();
  const photo = await db
    .select({ key: schema.photos.r2Key })
    .from(schema.photos)
    .where(eq(schema.photos.id, id))
    .get();
  if (!photo) return jsonError("Fotka nenalezena.", 404);

  const width = Number(form.get("width")) || null;
  const height = Number(form.get("height")) || null;

  await env.PHOTOS.put(photo.key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });
  await db
    .update(schema.photos)
    .set({ width, height })
    .where(eq(schema.photos.id, id));

  return jsonOk({ ok: true });
};
