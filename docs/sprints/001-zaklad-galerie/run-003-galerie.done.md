# Run 003: Galerie

**Status:** DONE
**Date:** 2026-06-02
**Sprint:** 001-zaklad-galerie
**Dashboard Run:** 38

## Zadání
- Stránky sekcí s mřížkou fotek
- Komponenta mřížky náhledů
- Hlavička sekce + prázdný stav

## Řešení
- Routa sekce → `src/pages/[section].astro` (getStaticPaths nad sekcemi, getCollection filtr + sort dle `order`, prázdný stav)
- Mřížka → `src/components/gallery/PhotoGrid.astro` (responzivní grid, `<Image>` lazy/webp/widths+sizes, caption, alt = coverAlt ?? caption)
- Build generuje 5 stránek sekcí + optimalizované náhledy (sharp → webp)

## Poznámky
- Neznámé sekce vrací 404 (server mode, jen prerenderované cesty); prázdné sekce mají hlášku.
- `object-cover` v PhotoGrid je zatím no-op (výška auto) — využije se, když Run 004 zavede pevný poměr stran.
- Rozklik na dlouhý text (tělo md) je Run 004 — mřížka zatím jen zobrazuje, neotvírá detail.
