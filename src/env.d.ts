/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    // E-mail ověřeného admina (z Cloudflare Access JWT, viz src/middleware.ts).
    adminEmail?: string;
  }
}
