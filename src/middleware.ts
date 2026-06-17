import type { MiddlewareHandler } from "astro";
import { readSession, SESSION_COOKIE } from "./lib/auth";

// Chrání administraci (`/sprava`, `/api/sprava`) přihlášením jménem + heslem.
// Ověřuje podepsanou session cookie. Login/forgot/reset a /api/auth jsou veřejné,
// jinak by se nešlo přihlásit.
const PROTECTED = /^\/(sprava|api\/sprava)(\/|$)/;
const PUBLIC = /^\/sprava\/(login|forgot|reset)\/?$/;

// Bezpečnostní hlavičky na všechny odpovědi (defense-in-depth).
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
};

function withSecurityHeaders(res: Response): Response {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  return res;
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const gate = async (): Promise<Response> => {
    const path = context.url.pathname;
    if (!PROTECTED.test(path) || PUBLIC.test(path)) return next();

    const { env } = await import("cloudflare:workers");
    // V dev fallback secret, ať jde admin testovat bez nastavení secretu.
    const secret =
      env.AUTH_SECRET ?? (import.meta.env.DEV ? "dev-insecure-secret" : "");
    if (!secret) {
      return new Response(
        "Přihlášení není nakonfigurováno (chybí AUTH_SECRET).",
        { status: 500 },
      );
    }

    const token = context.cookies.get(SESSION_COOKIE)?.value;
    const session = await readSession(token, secret);
    if (!session) {
      if (path.startsWith("/api/")) {
        return new Response("Nepřihlášeno.", { status: 401 });
      }
      return context.redirect(`/sprava/login?next=${encodeURIComponent(path)}`);
    }

    context.locals.adminEmail = session.username;

    // Historie změn — před každou změnou obsahu ulož snapshot (kromě akcí, které
    // obsah webu nemění: newsletter, heslo, stahování).
    const method = context.request.method;
    const SKIP = [
      "/api/sprava/newsletter",
      "/api/sprava/password",
      "/api/sprava/photos/download",
    ];
    if (
      path.startsWith("/api/sprava/") &&
      (method === "POST" || method === "PATCH" || method === "DELETE") &&
      !SKIP.some((p) => path.startsWith(p))
    ) {
      try {
        const { takeSnapshot } = await import("./lib/snapshots");
        await takeSnapshot(snapshotLabel(path, method));
      } catch {
        /* historie není kritická — chybu ignoruj */
      }
    }
    return next();
  };

  return withSecurityHeaders(await gate());
};

// Lidský popisek změny pro historii.
function snapshotLabel(path: string, method: string): string {
  if (path.startsWith("/api/sprava/snapshots/restore")) return "Před návratem na verzi";
  if (path.startsWith("/api/sprava/texts")) return "Texty webu";
  if (path.startsWith("/api/sprava/hero")) return "Pozadí – úvodní fotka";
  if (path.startsWith("/api/sprava/bg")) return "Pozadí – podklad stránek";
  if (path.startsWith("/api/sprava/lock")) return "Zámek webu";
  if (path.startsWith("/api/sprava/upload")) return "Nahrání fotky";
  if (path.includes("/photos/") && path.includes("/replace")) return "Úprava fotky (obrázek)";
  if (path.includes("/photos/bulk-delete")) return "Hromadné smazání fotek";
  if (path.includes("/photos/visibility")) return "Viditelnost fotek";
  if (path.startsWith("/api/sprava/photos"))
    return method === "DELETE" ? "Smazání fotky" : "Úprava fotky";
  if (path.startsWith("/api/sprava/galleries"))
    return method === "DELETE"
      ? "Smazání galerie"
      : method === "POST"
        ? "Nová galerie"
        : "Úprava galerie";
  if (path.startsWith("/api/sprava/tips"))
    return method === "DELETE" ? "Smazání tipu" : "Tip / Aktuálně";
  if (path.startsWith("/api/sprava/articles"))
    return method === "DELETE" ? "Smazání článku" : "Blog / článek";
  return "Změna obsahu";
}
