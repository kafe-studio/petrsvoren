/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    // Přihlašovací jméno ověřeného admina (z session cookie, viz src/middleware.ts).
    adminEmail?: string;
  }
}

// AUTH_SECRET je Workers secret (wrangler secret put) — není v wrangler.jsonc,
// proto ho doplníme do typu Env ručně.
declare namespace Cloudflare {
  interface Env {
    AUTH_SECRET?: string;
    TURNSTILE_SECRET?: string;
  }
}
