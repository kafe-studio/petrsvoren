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

const gate: MiddlewareHandler = async (context, next) => {
  const path = context.url.pathname;
  if (!PROTECTED.test(path) || PUBLIC.test(path)) return next();

  const { env } = await import("cloudflare:workers");
  // V dev fallback secret, ať jde admin testovat bez nastavení secretu.
  const secret =
    env.AUTH_SECRET ?? (import.meta.env.DEV ? "dev-insecure-secret" : "");
  if (!secret) {
    return new Response("Přihlášení není nakonfigurováno (chybí AUTH_SECRET).", {
      status: 500,
    });
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
  return next();
};

export const onRequest: MiddlewareHandler = async (context, next) => {
  const res = await gate(context, next);
  return withSecurityHeaders(res);
};
