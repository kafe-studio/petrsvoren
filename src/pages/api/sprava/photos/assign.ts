import type { APIRoute } from "astro";
import { eq, inArray } from "drizzle-orm";
import { getDb, schema } from "../../../../db";
import { jsonError, jsonOk, parseJsonBody } from "../../../../lib/admin-helpers";

export const prerender = false;

// Hromadné zařazení vybraných fotek do galerie a/nebo do výběru měsíce.
// galleryId → přidá do galerie (M:N, bez duplicit). month (RRRR-MM) → nastaví
// měsíc výběru všem. Aspoň jedno z toho musí přijít.
export const POST: APIRoute = async ({ request }) => {
  const body = await parseJsonBody<{
    ids?: unknown;
    galleryId?: unknown;
    month?: unknown;
  }>(request);
  if (!body || !Array.isArray(body.ids)) return jsonError("Chybí seznam id.");
  const ids = body.ids.filter((x): x is string => typeof x === "string");
  if (ids.length === 0) return jsonError("Nic k přiřazení.");

  const galleryId =
    typeof body.galleryId === "string" && body.galleryId.trim()
      ? body.galleryId.trim()
      : "";
  const month =
    typeof body.month === "string" && /^\d{4}-\d{2}$/.test(body.month)
      ? body.month
      : "";
  if (!galleryId && !month) {
    return jsonError("Vyber galerii nebo měsíc.");
  }

  const db = await getDb();

  if (galleryId) {
    const g = await db
      .select({ id: schema.galleries.id })
      .from(schema.galleries)
      .where(eq(schema.galleries.id, galleryId))
      .get();
    if (!g) return jsonError("Galerie nenalezena.", 404);
    // Vlož jen ty, co v ní ještě nejsou (PK photoId+galleryId → onConflictDoNothing).
    await db
      .insert(schema.photoGalleries)
      .values(ids.map((photoId) => ({ photoId, galleryId })))
      .onConflictDoNothing();
  }

  if (month) {
    await db
      .update(schema.photos)
      .set({ month })
      .where(inArray(schema.photos.id, ids));
  }

  return jsonOk({ assigned: ids.length });
};
