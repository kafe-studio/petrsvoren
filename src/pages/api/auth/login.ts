import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../../../db";
import { verifyPassword, createSession, SESSION_COOKIE } from "../../../lib/auth";

export const prerender = false;

// Přihlášení jménem + heslem → podepsaná session cookie. Mimo /api/admin, aby ho
// middleware nechránil (jinak by se nešlo přihlásit).
export const POST: APIRoute = async ({ request, cookies }) => {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Neplatný JSON." }, { status: 400 });
  }
  const username =
    typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password) {
    return Response.json({ error: "Vyplň jméno i heslo." }, { status: 400 });
  }

  const secret =
    env.AUTH_SECRET ?? (import.meta.env.DEV ? "dev-insecure-secret" : "");
  if (!secret) {
    return Response.json(
      { error: "Přihlášení není nakonfigurováno (chybí AUTH_SECRET)." },
      { status: 500 },
    );
  }

  const db = await getDb();
  const user = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.username, username))
    .get();
  // Stejná odpověď pro neexistujícího uživatele i špatné heslo (neúnik informace).
  const ok =
    !!user && (await verifyPassword(password, user.passwordHash, user.passwordSalt));
  if (!ok) {
    return Response.json({ error: "Neplatné jméno nebo heslo." }, { status: 401 });
  }

  const token = await createSession(user!.username, secret);
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return Response.json({ ok: true });
};
