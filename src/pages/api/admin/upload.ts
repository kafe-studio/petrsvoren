import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getDb, schema } from "../../../db";

export const prerender = false;

// Upload jedné fotky (klient posílá dávku jako víc requestů → per-foto progress).
// Originál do R2, metadata do D1. Chráněno Cloudflare Access (/api/admin/*).
export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Neplatný formulář." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return Response.json({ error: "Nahraj obrázek." }, { status: 400 });
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

  const id = crypto.randomUUID();
  const key = `photos/${id}.${ext}`;

  try {
    await env.PHOTOS.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
    const db = await getDb();
    await db
      .insert(schema.photos)
      .values({ id, r2Key: key, caption, width, height, exifJson });
    return Response.json({ id, key, caption }, { status: 201 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Upload selhal." },
      { status: 500 },
    );
  }
};
