import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../db";

export const prerender = false;

// Servíruje originál fotky z R2 podle id. Veřejné (fotky jsou veřejné), s dlouhým
// cache (klíč je neměnný). Pozn.: 1 D1 lookup na request — pro produkci lze později
// nahradit veřejným R2 bucketem / custom doménou.
export const GET: APIRoute = async ({ params }) => {
  const id = params.id ?? "";
  const db = await getDb();
  const row = await db
    .select({ key: schema.photos.r2Key })
    .from(schema.photos)
    .where(eq(schema.photos.id, id))
    .get();
  if (!row) return new Response("Not found", { status: 404 });

  const obj = await env.PHOTOS.get(row.key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
};
