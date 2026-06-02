# Run 002: Datový model fotek

**Status:** DONE
**Date:** 2026-06-02
**Sprint:** 001-zaklad-galerie
**Dashboard Run:** 37

## Zadání
- Content collection fotek
- Rozhodnout úložiště + náhledy
- Ukázkové fotky a popisky

## Řešení
- `photos` collection → `src/content.config.ts` (glob loader, `section` z.enum, `caption`, `cover: image()`, `coverAlt`, `order`)
- `sectionSlugs` tuple → `src/config/site.ts` (runtime validace sekce)
- Úložiště: jeden `.md`/fotka v `src/content/photos/<sekce>/` + co-located obrázek; tělo md = dlouhý text
- Náhledy: Astro `<Image>`/`getImage` (sharp pod kapotou) — žádný separátní pipeline
- 4 ukázky (`street/`, `lide/`) přes sharp, 2 s dlouhým textem

## Poznámky
- MCP servery nepřipojené; `image()` + glob ověřeny přes oficiální Astro docs + build.
- `coverAlt` optional → v Run 003 alt fallback na `caption` (a11y).
- Ukázkové fotky jsou placeholdery (barevné plochy s labelem) — Petr nahradí reálnými.
