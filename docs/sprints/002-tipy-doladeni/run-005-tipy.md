# Run 005: Tipy

**Status:** TODO
**Date:** 2026-06-02
**Sprint:** 002-tipy-doladeni
**Dashboard Run:** 40

<!-- dashboard-tasks: {"Datový model tipů": 175, "Blok tipů na homepage": 176} -->

## Kontext
MVP (Sprint 001) je hotové. Tento run přidá editorský blok „tipů" — fotka měsíce, nová
kniha, skvělá výstava apod. Klidná upoutávka na homepage, spravovaná přes git jako fotky.

## Zadání
- [ ] Content collection `tips` v content.config.ts (title, text/tělo, volitelný image + link, order, aktivní) (mcp)
- [ ] Komponenta `Tips.astro` — zobrazení tipů na homepage (klidné, bez křiku)
- [ ] Zapojit do index.astro mezi hero a rozcestník sekcí; prázdný stav = blok se nezobrazí
- [ ] 2 ukázkové tipy + build

## Soubory ke čtení
- src/content.config.ts — sem přidat `tips` collection
- src/pages/index.astro — kam blok zapojit
- src/components/gallery/PhotoGrid.astro — vzor render() + Image v kolekci
