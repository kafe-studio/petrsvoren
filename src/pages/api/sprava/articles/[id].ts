import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { eq, and, ne } from "drizzle-orm";
import { getDb, schema } from "../../../../db";
import { jsonError, jsonOk, slugify } from "../../../../lib/admin-helpers";

export const prerender = false;

function tagsJson(raw: string): string | null {
  const arr = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? JSON.stringify(arr) : null;
}

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
    .from(schema.articles)
    .where(eq(schema.articles.id, id))
    .get();
  if (!existing) return jsonError("Článek nenalezen.", 404);

  const title = String(form.get("title") ?? "").trim();
  if (!title) return jsonError("Název je povinný.");
  const slug = slugify(String(form.get("slug") ?? "") || title);
  if (!slug) return jsonError("Neplatný slug.");
  const clash = await db
    .select({ id: schema.articles.id })
    .from(schema.articles)
    .where(and(eq(schema.articles.slug, slug), ne(schema.articles.id, id)))
    .get();
  if (clash) return jsonError("Jiný článek už má tento slug.", 409);

  const pubRaw = String(form.get("pubDate") ?? "").trim();
  const pubDate = pubRaw ? new Date(pubRaw) : existing.pubDate;

  let r2Key = existing.r2Key;
  const file = form.get("image");
  if (file instanceof File && file.size > 0 && file.type.startsWith("image/")) {
    r2Key = `articles/${id}.jpg`;
    await env.PHOTOS.put(r2Key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
  }

  await db
    .update(schema.articles)
    .set({
      slug,
      title,
      description: String(form.get("description") ?? "").trim(),
      author: String(form.get("author") ?? "").trim(),
      pubDate: pubDate && !isNaN(pubDate.getTime()) ? pubDate : existing.pubDate,
      body: String(form.get("body") ?? ""),
      tags: tagsJson(String(form.get("tags") ?? "")),
      category: String(form.get("category") ?? "").trim() || null,
      r2Key,
    })
    .where(eq(schema.articles.id, id));
  return jsonOk();
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id ?? "";
  const db = await getDb();
  const existing = await db
    .select({ r2Key: schema.articles.r2Key })
    .from(schema.articles)
    .where(eq(schema.articles.id, id))
    .get();
  if (!existing) return jsonError("Článek nenalezen.", 404);
  if (existing.r2Key) await env.PHOTOS.delete(existing.r2Key).catch(() => {});
  await db.delete(schema.articles).where(eq(schema.articles.id, id));
  return jsonOk();
};
