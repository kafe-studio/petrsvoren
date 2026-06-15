import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../db";
import { jsonError, parseJsonBody, slugify } from "../../../lib/admin-helpers";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await parseJsonBody<{
    title?: unknown;
    slug?: unknown;
    description?: unknown;
  }>(request);
  if (!body) return jsonError("Neplatný JSON.");
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return jsonError("Název je povinný.");
  const slug =
    (typeof body.slug === "string" && slugify(body.slug)) || slugify(title);
  if (!slug) return jsonError("Neplatný slug.");
  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;

  const db = await getDb();
  const exists = await db
    .select({ id: schema.galleries.id })
    .from(schema.galleries)
    .where(eq(schema.galleries.slug, slug))
    .get();
  if (exists) return jsonError("Galerie s tímto slugem už existuje.", 409);

  const all = await db.select({ id: schema.galleries.id }).from(schema.galleries);
  const id = crypto.randomUUID();
  await db
    .insert(schema.galleries)
    .values({ id, slug, title, description, sortOrder: all.length });
  return Response.json({ id, slug, title }, { status: 201 });
};
