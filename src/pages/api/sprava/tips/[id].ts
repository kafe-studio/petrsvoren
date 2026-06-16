import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../../db";
import { jsonError, jsonOk } from "../../../../lib/admin-helpers";

export const prerender = false;

// Úprava tipu (multipart). Volitelně nahradí obrázek.
export const PATCH: APIRoute = async ({ params, request }) => {
  const id = params.id ?? "";
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Neplatný formulář.");
  }
  const db = await getDb();
  const existing = await db
    .select()
    .from(schema.tips)
    .where(eq(schema.tips.id, id))
    .get();
  if (!existing) return jsonError("Tip nenalezen.", 404);

  const title = String(form.get("title") ?? "").trim();
  if (!title) return jsonError("Nadpis je povinný.");
  const bodyText = String(form.get("bodyText") ?? "").trim() || null;
  const link = String(form.get("link") ?? "").trim() || null;
  const active = form.get("active") !== null;

  let r2Key = existing.r2Key;
  const file = form.get("image");
  if (file instanceof File && file.size > 0 && file.type.startsWith("image/")) {
    r2Key = `tips/${id}.jpg`;
    await env.PHOTOS.put(r2Key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
  }

  await db
    .update(schema.tips)
    .set({ title, bodyText, link, active, r2Key })
    .where(eq(schema.tips.id, id));
  return jsonOk();
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id ?? "";
  const db = await getDb();
  const existing = await db
    .select({ r2Key: schema.tips.r2Key })
    .from(schema.tips)
    .where(eq(schema.tips.id, id))
    .get();
  if (!existing) return jsonError("Tip nenalezen.", 404);
  if (existing.r2Key) await env.PHOTOS.delete(existing.r2Key).catch(() => {});
  await db.delete(schema.tips).where(eq(schema.tips.id, id));
  return jsonOk();
};
