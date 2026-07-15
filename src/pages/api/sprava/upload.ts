import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../db";
import { jsonError } from "../../../lib/admin-helpers";

export const prerender = false;

// Upload jedné fotky (klient posílá dávku jako víc requestů → per-foto progress).
// Originál do R2, metadata do D1. Volitelně rovnou zařadí do galerie (galleryId)
// a/nebo do výběru měsíce (month = RRRR-MM).
export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Neplatný formulář.");
  }

  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return jsonError("Nahraj obrázek.");
  }

  const rawCaption = form.get("caption");
  const caption =
    (typeof rawCaption === "string" ? rawCaption.trim() : "") ||
    file.name.replace(/\.[^.]+$/, "");
  const width = Number(form.get("width")) || null;
  const height = Number(form.get("height")) || null;
  const rawExif = form.get("exifJson");
  const exifJson =
    typeof rawExif === "string" && rawExif.trim() ? rawExif : null;
  const ext = (file.name.match(/\.([a-zA-Z0-9]+)$/)?.[1] ?? "jpg").toLowerCase();

  // Cíl zařazení (volitelné).
  const galleryId =
    typeof form.get("galleryId") === "string"
      ? (form.get("galleryId") as string).trim()
      : "";
  const rawMonth = form.get("month");
  const month =
    typeof rawMonth === "string" && /^\d{4}-\d{2}$/.test(rawMonth)
      ? rawMonth
      : null;

  const id = crypto.randomUUID();
  const key = `photos/${id}.${ext}`;

  try {
    await env.PHOTOS.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
    const db = await getDb();
    await db
      .insert(schema.photos)
      .values({ id, r2Key: key, caption, width, height, exifJson, month });
    // Rovnou do galerie, pokud existuje.
    if (galleryId) {
      const g = await db
        .select({ id: schema.galleries.id })
        .from(schema.galleries)
        .where(eq(schema.galleries.id, galleryId))
        .get();
      if (g) {
        await db
          .insert(schema.photoGalleries)
          .values({ photoId: id, galleryId })
          .onConflictDoNothing();
      }
    }
    return Response.json({ id, key, caption }, { status: 201 });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Upload selhal.", 500);
  }
};
