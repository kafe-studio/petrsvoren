# Run 002: Datový model fotek

**Status:** TODO
**Date:** 2026-06-02
**Sprint:** 001-zaklad-galerie

## Kontext
Run 001 postavil branding, navigaci ze sekcí (`src/config/site.ts` → `sections`, `navLinks`)
a homepage s hero. Sekce zatím vedou na 404. Tento run zavede datový model fotek: content
collection, kde každá fotka patří do sekce, má krátký popisek a volitelný delší text. sharp
vygeneruje náhledy pro mřížku. Galerie (stránky sekcí) se postaví až v Run 003 — tady jen
data + ukázky, ať je na čem stavět.

## Zadání
- [ ] Content collection `photos` v `src/content.config.ts` přes `glob` loader (mcp)
      — schema: `section` (SectionSlug), `caption` (krátký), `body`/dlouhý text volitelný, `image`, `order`
- [ ] Rozhodnout úložiště fotek: `src/content/photos/` vs `public/` + návaznost na Astro `Image`/sharp (mcp)
- [ ] sharp pipeline / Astro assets na náhledy do mřížky (rozměr, formát, lazy) (mcp)
- [ ] 3–5 ukázkových fotek napříč 2 sekcemi (placeholder obrázky) pro vývoj galerie
- [ ] Ověřit build (astro check + build), náhledy se generují

## Soubory ke čtení
- src/content.config.ts — sem přidat `photos` collection (vedle `blog`)
- src/config/site.ts — `SectionSlug` typ pro validaci sekce ve schématu
- astro.config.mjs — sharp/image nastavení, integrace
- docs/sprints/001-zaklad-galerie/run-001-branding-layout.done.md — co už stojí
