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
  // ID je unikátní napříč tabulkami — zkus fotky, pak tipy, pak články.
  const photo = await db
    .select({ key: schema.photos.r2Key })
    .from(schema.photos)
    .where(eq(schema.photos.id, id))
    .get();
  let key = photo?.key ?? null;
  if (!key) {
    const tip = await db
      .select({ key: schema.tips.r2Key })
      .from(schema.tips)
      .where(eq(schema.tips.id, id))
      .get();
    key = tip?.key ?? null;
  }
  if (!key) {
    const article = await db
      .select({ key: schema.articles.r2Key })
      .from(schema.articles)
      .where(eq(schema.articles.id, id))
      .get();
    key = article?.key ?? null;
  }
  if (!key) return new Response("Not found", { status: 404 });

  const obj = await env.PHOTOS.get(key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  // Krátká cache + okamžité servírování staré verze při revalidaci. Po úpravě
  // fotky (stejný klíč) se nová verze projeví do hodiny; ETag řeší revalidaci.
  headers.set(
    "cache-control",
    "public, max-age=3600, stale-while-revalidate=604800",
  );
  return new Response(obj.body, { headers });
};
