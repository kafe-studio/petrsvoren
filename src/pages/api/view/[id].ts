import type { APIRoute } from "astro";
import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "../../../db";

export const prerender = false;

// Zaznamená zobrazení fotky (otevření v lightboxu). Veřejné, bez autentizace.
// Klient volá jednou za fotku a načtení stránky (deduplikace na klientu).
export const POST: APIRoute = async ({ params }) => {
  const id = params.id ?? "";
  if (!id) return new Response(null, { status: 400 });
  try {
    const db = await getDb();
    await db
      .update(schema.photos)
      .set({ views: sql`${schema.photos.views} + 1` })
      .where(eq(schema.photos.id, id));
  } catch {
    /* tichý fail — statistika není kritická */
  }
  return new Response(null, { status: 204 });
};
