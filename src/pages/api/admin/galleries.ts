import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../db";

export const prerender = false;

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export const POST: APIRoute = async ({ request }) => {
  let body: { title?: unknown; slug?: unknown; description?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Neplatný JSON." }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return Response.json({ error: "Název je povinný." }, { status: 400 });
  const slug =
    (typeof body.slug === "string" && slugify(body.slug)) || slugify(title);
  if (!slug)
    return Response.json({ error: "Neplatný slug." }, { status: 400 });
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
  if (exists)
    return Response.json({ error: "Galerie s tímto slugem už existuje." }, { status: 409 });

  const all = await db.select({ id: schema.galleries.id }).from(schema.galleries);
  const id = crypto.randomUUID();
  await db
    .insert(schema.galleries)
    .values({ id, slug, title, description, sortOrder: all.length });
  return Response.json({ id, slug, title }, { status: 201 });
};
