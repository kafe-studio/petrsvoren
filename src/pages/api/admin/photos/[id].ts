import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../../db";

export const prerender = false;

interface GalleryAssign {
  galleryId: string;
  isCover?: boolean;
}
interface Body {
  caption?: unknown;
  bodyText?: unknown;
  alt?: unknown;
  month?: unknown;
  showExif?: unknown;
  sortOrder?: unknown;
  galleries?: unknown;
}

export const PATCH: APIRoute = async ({ request, params }) => {
  const id = params.id ?? "";
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Neplatný JSON." }, { status: 400 });
  }
  const db = await getDb();

  const photo = await db
    .select({ id: schema.photos.id })
    .from(schema.photos)
    .where(eq(schema.photos.id, id))
    .get();
  if (!photo) return Response.json({ error: "Fotka nenalezena." }, { status: 404 });

  // Pole fotky (jen co přišlo).
  const set: Record<string, unknown> = {};
  if (typeof body.caption === "string") set.caption = body.caption.trim();
  if (body.bodyText !== undefined)
    set.bodyText =
      typeof body.bodyText === "string" && body.bodyText.trim()
        ? body.bodyText
        : null;
  if (body.alt !== undefined)
    set.alt =
      typeof body.alt === "string" && body.alt.trim() ? body.alt.trim() : null;
  if (body.month !== undefined)
    set.month =
      typeof body.month === "string" && /^\d{4}-\d{2}$/.test(body.month)
        ? body.month
        : null;
  if (body.showExif !== undefined) set.showExif = Boolean(body.showExif);
  if (typeof body.sortOrder === "number") set.sortOrder = body.sortOrder;
  if (Object.keys(set).length > 0)
    await db.update(schema.photos).set(set).where(eq(schema.photos.id, id));

  // Zařazení do galerií — nahradit kompletně tím, co přišlo.
  if (Array.isArray(body.galleries)) {
    const assigns = (body.galleries as GalleryAssign[]).filter(
      (g) => g && typeof g.galleryId === "string",
    );
    await db
      .delete(schema.photoGalleries)
      .where(eq(schema.photoGalleries.photoId, id));
    for (const g of assigns) {
      // Jedna hlavní fotka na galerii → zruš hlavní u ostatních.
      if (g.isCover) {
        await db
          .update(schema.photoGalleries)
          .set({ isCover: false })
          .where(eq(schema.photoGalleries.galleryId, g.galleryId));
      }
      await db
        .insert(schema.photoGalleries)
        .values({ photoId: id, galleryId: g.galleryId, isCover: Boolean(g.isCover) });
    }
  }

  return Response.json({ ok: true });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id ?? "";
  const db = await getDb();
  const photo = await db
    .select({ key: schema.photos.r2Key })
    .from(schema.photos)
    .where(eq(schema.photos.id, id))
    .get();
  if (!photo) return Response.json({ error: "Fotka nenalezena." }, { status: 404 });

  try {
    await env.PHOTOS.delete(photo.key);
  } catch {
    /* R2 smazání selhalo — i tak smaž řádek (cascade smaže zařazení) */
  }
  await db.delete(schema.photos).where(eq(schema.photos.id, id));
  return Response.json({ ok: true });
};
