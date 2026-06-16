import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../db";
import { jsonError, jsonOk, parseJsonBody } from "../../../lib/admin-helpers";
import { hashPassword } from "../../../lib/auth";

export const prerender = false;

// Změna hesla admin uživatele. Chráněno middlewarem (jen přihlášený admin).
export const POST: APIRoute = async ({ request }) => {
  const body = await parseJsonBody<{ username?: unknown; password?: unknown }>(
    request,
  );
  const username =
    body && typeof body.username === "string" ? body.username.trim() : "";
  const password =
    body && typeof body.password === "string" ? body.password : "";
  if (!username) return jsonError("Vyber uživatele.");
  if (password.length < 8) return jsonError("Heslo musí mít aspoň 8 znaků.");

  const db = await getDb();
  const user = await db
    .select({ id: schema.adminUsers.id })
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.username, username))
    .get();
  if (!user) return jsonError("Uživatel nenalezen.", 404);

  const { hash, salt } = await hashPassword(password);
  await db
    .update(schema.adminUsers)
    .set({ passwordHash: hash, passwordSalt: salt })
    .where(eq(schema.adminUsers.id, user.id));
  return jsonOk();
};
