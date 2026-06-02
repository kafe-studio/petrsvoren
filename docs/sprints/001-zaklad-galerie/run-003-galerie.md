# Run 003: Galerie

**Status:** TODO
**Date:** 2026-06-02
**Sprint:** 001-zaklad-galerie
**Dashboard Run:** 38

<!-- dashboard-tasks: {"Stránky sekcí s mřížkou fotek": 169, "Komponenta mřížky náhledů": 170, "Hlavička sekce a prázdný stav": 171} -->

## Kontext
Run 002 zavedl content collection `photos` (sekce, caption, cover přes `image()`, dlouhý
text v těle). Navigace i homepage už odkazují na `/<sekce>/`, ale stránky zatím 404. Tento
run je postaví: dynamická routa pro sekci s responzivní mřížkou fotek (náhledy přes `<Image>`).
Rozklik na dlouhý text je až Run 004 — tady mřížka + popisky.

## Zadání
- [ ] Dynamická routa `src/pages/[section].astro`: `getStaticPaths` nad sekcemi, `getCollection("photos")` filtr + sort dle `order` (mcp)
- [ ] Komponenta `PhotoGrid.astro`: mřížka (linky/řádky), `<Image>` náhledy lazy, caption, alt fallback na caption (mcp)
- [ ] Hlavička sekce (název ze `site.ts`) + prázdný stav, když sekce nemá fotky
- [ ] Build + ověřit, že se náhledy generují (sharp), žádné 404 na známé sekce

## Soubory ke čtení
- src/config/site.ts — sekce (slug/title)
- src/content.config.ts — schema photos (pole k renderu)
- src/layouts/BaseLayout.astro — jak zabalit stránku
- src/pages/index.astro — styl mřížky sekcí (vizuální konzistence)
