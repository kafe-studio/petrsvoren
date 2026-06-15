import type { MiddlewareHandler } from "astro";
import { verifyAccessJwt } from "./lib/access";

// Chrání admin plochu. Cloudflare Access drží login wall na hraně pro `/admin`
// a `/api/admin`; tohle je druhá vrstva — validuje JWT z `Cf-Access-Jwt-Assertion`
// proti JWKS team domény (defense-in-depth, doporučeno i Cloudflare).
const PROTECTED = /^\/(admin|api\/admin)(\/|$)/;

export const onRequest: MiddlewareHandler = async (context, next) => {
  if (!PROTECTED.test(context.url.pathname)) return next();

  // Lokální dev nemá edge Access ani JWT hlavičku → bypass, aby šel admin
  // testovat. V produkci (`import.meta.env.DEV === false`) se vždy validuje.
  if (import.meta.env.DEV) {
    context.locals.adminEmail = "dev@local";
    return next();
  }

  const { env } = await import("cloudflare:workers");
  const aud = env.CF_ACCESS_AUD;
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN;
  if (!aud || !teamDomain) {
    return new Response(
      "Admin není nakonfigurován (chybí CF Access proměnné).",
      { status: 500 },
    );
  }

  const token = context.request.headers.get("cf-access-jwt-assertion");
  if (!token) {
    return new Response("Chybí Cloudflare Access JWT.", { status: 403 });
  }

  const identity = await verifyAccessJwt(token, aud, teamDomain);
  if (!identity) {
    return new Response("Neplatný Cloudflare Access token.", { status: 403 });
  }

  // Allowlist e-mailů — do administrace smí jen vyjmenovaní (Petr Svoreň + superadmin).
  // Konfiguruje ADMIN_EMAILS (čárkou oddělené). Prázdná = pustí každého, koho
  // propustil Cloudflare Access (pak je jedinou bránou CF Access policy).
  const allow = (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const email = (identity.email ?? "").toLowerCase();
  if (allow.length > 0 && !allow.includes(email)) {
    return new Response("Tento účet nemá přístup do administrace.", {
      status: 403,
    });
  }

  context.locals.adminEmail = identity.email ?? identity.sub ?? "unknown";
  return next();
};
