# Run 001: Branding & layout

**Status:** DONE
**Date:** 2026-06-02
**Sprint:** 001-zaklad-galerie
**Dashboard Run:** 36

## Zadání
- Branding + pole sekcí + kontakt v configu
- Navigace generovaná ze sekcí
- Patička s kontaktem (FB + e-mail)
- Homepage s úvodní fotkou

## Řešení
- Branding/sekce/kontakt → `src/config/site.ts` (`sections` as const, odvozený `navLinks` + typ `SectionSlug`)
- Navigace → `Navbar.astro` i `Footer.astro` importují `navLinks` z configu (žádná duplikace)
- Kontakt → `Footer.astro`: mailto + FB odkaz, ikony přes astro-icon (`lucide:mail`, `lucide:facebook`)
- Homepage → `index.astro`: hero s CSS background `/hero.jpg` + rozcestník sekcí
- Vedlejší: `Seo.astro` zbaven `twitter` bloku (pole smazáno z configu)

## Poznámky
- MCP servery (worker-mcp/context7) v session nepřipojené; astro-icon ověřen přes oficiální docs + build.
- Placeholdery k nahrazení: `email`, `socialLinks.facebook`, `url` v site.ts; hero soubor `public/hero.jpg`.
- Odkazy na `/sekce/` a `/kontakt/` zatím 404 — stránky vzniknou v Run 003 / 006.
- Hero přes CSS bg obchází astro:assets optimalizaci — zvážit v Run 002.
