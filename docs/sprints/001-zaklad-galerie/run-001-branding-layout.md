# Run 001: Branding & layout

**Status:** TODO
**Date:** 2026-06-02
**Sprint:** 001-zaklad-galerie
**Dashboard Run:** 36

<!-- dashboard-tasks: {"Branding a sekce v configu": 162, "Navigace podle sekcí": 163, "Patička s kontaktem (FB + e-mail)": 164, "Homepage s úvodní fotkou": 165} -->

## Kontext
Čerstvý bootstrap z kostry (Astro 6 + Cloudflare + Tailwind 4, blog-based šablona).
Tento run přepne projekt z generické kostry na Petrovu fotoprezentaci: nastaví branding,
definuje sekce galerie v jednom configu, upraví navigaci a patičku (kontakt přes FB +
e-mail) a postaví homepage s úvodní (hero) fotkou. Datový model fotek a samotná galerie
přijdou v Run 002–003 — tady jen layout a kostra navigace.

## Zadání
- [ ] V `src/config/site.ts` nastavit branding (name, description, author, email, facebook),
      vyčistit nepoužité (twitter, phone, address dle potřeby) a přidat pole `sections`
      (~5 sekcí: slug + název, např. street / lidé / samota / …)
- [ ] `Navbar.astro` — generovat odkazy ze `sections` (+ homepage, kontakt), odstranit blog odkaz
- [ ] `Footer.astro` — kontakt: Facebook + e-mail (astro-icon), odstranit nepoužité
- [ ] `index.astro` — homepage s hero (úvodní fotka, zatím placeholder) + klidný úvodní text;
      odstranit blog-listing z kostry
- [ ] Ověřit `pnpm dev` / build bez chyb (astro check)

## Soubory ke čtení
- src/config/site.ts — centrální config, sem přijdou sekce a kontakt
- src/components/layout/Navbar.astro — navigace, předělat na sekce
- src/components/layout/Footer.astro — patička, kontakt FB + e-mail
- src/pages/index.astro — homepage, předělat na hero + úvod
- src/layouts/BaseLayout.astro — jak se skládá stránka (head, SEO)
