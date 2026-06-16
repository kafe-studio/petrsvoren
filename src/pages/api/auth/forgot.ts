import type { APIRoute } from "astro";
import { eq, or } from "drizzle-orm";
import { getDb, schema } from "../../../db";
import { jsonOk } from "../../../lib/admin-helpers";
import { sendEmail } from "../../../lib/email";

export const prerender = false;

// Žádost o obnovu hesla. Vždy vrací OK (neprozrazuje, zda účet existuje).
// Když účet s daným jménem/e-mailem existuje a má e-mail, pošle odkaz na reset.
export const POST: APIRoute = async ({ request, url }) => {
  let body: { identifier?: unknown };
  try {
    body = (await request.json()) as { identifier?: unknown };
  } catch {
    return jsonOk();
  }
  const ident =
    typeof body.identifier === "string" ? body.identifier.trim() : "";
  if (!ident) return jsonOk();

  const db = await getDb();
  const user = await db
    .select()
    .from(schema.adminUsers)
    .where(
      or(
        eq(schema.adminUsers.username, ident),
        eq(schema.adminUsers.email, ident),
      ),
    )
    .get();

  if (user?.email) {
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hodina
    await db
      .insert(schema.passwordResets)
      .values({ token, userId: user.id, expiresAt });

    const link = `${url.origin}/sprava/reset/?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Obnova hesla – administrace petrsvoren",
      html: `
        <p>Ahoj,</p>
        <p>požádal(a) jsi o obnovu hesla do administrace. Klikni na odkaz níže
        (platí 1 hodinu):</p>
        <p><a href="${link}">${link}</a></p>
        <p>Pokud jsi o obnovu nežádal(a), tento e-mail ignoruj.</p>
      `,
    });
  }

  return jsonOk();
};
