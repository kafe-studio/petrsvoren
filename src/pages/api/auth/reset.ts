import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../db";
import { jsonError, jsonOk } from "../../../lib/admin-helpers";
import { hashPassword } from "../../../lib/auth";

export const prerender = false;

// Nastavení nového hesla podle reset tokenu.
export const POST: APIRoute = async ({ request }) => {
  let body: { token?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { token?: unknown; password?: unknown };
  } catch {
    return jsonError("Neplatná data.");
  }
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token) return jsonError("Chybí token.");
  if (password.length < 8)
    return jsonError("Heslo musí mít aspoň 8 znaků.");

  const db = await getDb();
  const row = await db
    .select()
    .from(schema.passwordResets)
    .where(eq(schema.passwordResets.token, token))
    .get();
  if (!row || row.used || row.expiresAt.getTime() < Date.now()) {
    return jsonError("Odkaz je neplatný nebo vypršel.", 410);
  }

  const { hash, salt } = await hashPassword(password);
  await db
    .update(schema.adminUsers)
    .set({ passwordHash: hash, passwordSalt: salt })
    .where(eq(schema.adminUsers.id, row.userId));
  await db
    .update(schema.passwordResets)
    .set({ used: true })
    .where(eq(schema.passwordResets.token, token));

  return jsonOk();
};
