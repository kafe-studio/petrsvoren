import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../db";
import { jsonError, jsonOk, slugify } from "../../../lib/admin-helpers";

export const prerender = false;

function tagsJson(raw: string): string | null {
  const arr = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? JSON.stringify(arr) : null;
}

// Vytvoření článku (multipart: title, slug?, description, author, pubDate,
// tags, category, body markdown, volitelný titulní obrázek).
export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Neplatný formulář.");
  }
  const title = String(form.get("title") ?? "").trim();
  if (!title) return jsonError("Název je povinný.");
  const slug = slugify(String(form.get("slug") ?? "") || title);
  if (!slug) return jsonError("Neplatný slug.");

  const db = await getDb();
  const exists = await db
    .select({ id: schema.articles.id })
    .from(schema.articles)
    .where(eq(schema.articles.slug, slug))
    .get();
  if (exists) return jsonError("Článek s tímto slugem už existuje.", 409);

  const pubRaw = String(form.get("pubDate") ?? "").trim();
  const pubDate = pubRaw ? new Date(pubRaw) : new Date();
  const id = crypto.randomUUID();
  let r2Key: string | null = null;
  const file = form.get("image");
  if (file instanceof File && file.size > 0 && file.type.startsWith("image/")) {
    r2Key = `articles/${id}.jpg`;
    await env.PHOTOS.put(r2Key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
  }

  await db.insert(schema.articles).values({
    id,
    slug,
    title,
    description: String(form.get("description") ?? "").trim(),
    author: String(form.get("author") ?? "").trim(),
    pubDate: isNaN(pubDate.getTime()) ? new Date() : pubDate,
    body: String(form.get("body") ?? ""),
    tags: tagsJson(String(form.get("tags") ?? "")),
    category: String(form.get("category") ?? "").trim() || null,
    r2Key,
  });
  return jsonOk({ id, slug }, 201);
};
