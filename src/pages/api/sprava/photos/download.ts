import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { inArray } from "drizzle-orm";
import { zipSync, type Zippable } from "fflate";
import { getDb, schema } from "../../../../db";
import { jsonError, parseJsonBody } from "../../../../lib/admin-helpers";

export const prerender = false;

function slugName(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "fotka"
  );
}

// Stažení vybraných fotek jako jeden ZIP. Originály z R2 sbalí fflate.
export const POST: APIRoute = async ({ request }) => {
  const body = await parseJsonBody<{ ids?: unknown }>(request);
  if (!body || !Array.isArray(body.ids)) return jsonError("Chybí seznam id.");
  const ids = body.ids.filter((x): x is string => typeof x === "string");
  if (ids.length === 0) return jsonError("Nic ke stažení.");

  const db = await getDb();
  const rows = await db
    .select({
      key: schema.photos.r2Key,
      caption: schema.photos.caption,
    })
    .from(schema.photos)
    .where(inArray(schema.photos.id, ids));
  if (rows.length === 0) return jsonError("Fotky nenalezeny.", 404);

  const files: Zippable = {};
  const used = new Set<string>();
  for (const r of rows) {
    const obj = await env.PHOTOS.get(r.key);
    if (!obj) continue;
    const ext = r.key.match(/\.([a-zA-Z0-9]+)$/)?.[1] ?? "jpg";
    let name = `${slugName(r.caption)}.${ext}`;
    let i = 2;
    while (used.has(name)) name = `${slugName(r.caption)}-${i++}.${ext}`;
    used.add(name);
    files[name] = new Uint8Array(await obj.arrayBuffer());
  }

  // level 0 = bez komprese (JPEG už je komprimovaný → šetří CPU).
  const zip = zipSync(files, { level: 0 });
  return new Response(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="fotky.zip"',
    },
  });
};
