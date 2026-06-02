# Run 005: Tipy

**Status:** DONE
**Date:** 2026-06-02
**Sprint:** 002-tipy-doladeni
**Dashboard Run:** 40

## Zadání
- Datový model tipů
- Blok tipů na homepage

## Řešení
- `tips` collection → `src/content.config.ts` (title, image() optional, link, order, active)
- `src/components/home/Tips.astro` → klidný blok, filtr `active`, sort `order`, render těl; zobrazí se jen když existují tipy
- Zapojeno do `index.astro` mezi hero a rozcestník sekcí
- 2 ukázky (`fotka-mesice` s obrázkem, `vystava` s odkazem)

## Poznámky
- MCP nepřipojené; vzor ověřen z Run 002/004 + build artefakt (blok v index.html).
- `link` tipu je plain href bez target/rel — u externích odkazů zvážit `_blank`/noopener.
