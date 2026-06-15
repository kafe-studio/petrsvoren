import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../../db";

export const prerender = false;

export const PATCH: APIRoute = async ({ request, params }) => {
  const id = params.id ?? "";
  let body: { title?: unknown; description?: unknown; sortOrder?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Neplatný JSON." }, { status: 400 });
  }
  const set: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim())
    set.title = body.title.trim();
  if (body.description !== undefined)
    set.description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
  if (typeof body.sortOrder === "number") set.sortOrder = body.sortOrder;
  if (Object.keys(set).length === 0)
    return Response.json({ ok: true });

  const db = await getDb();
  await db.update(schema.galleries).set(set).where(eq(schema.galleries.id, id));
  return Response.json({ ok: true });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id ?? "";
  const db = await getDb();
  // Cascade smaže i zařazení fotek do této galerie (photo_galleries).
  await db.delete(schema.galleries).where(eq(schema.galleries.id, id));
  return Response.json({ ok: true });
};
