# Run 004: Rozklik fotky

**Status:** TODO
**Date:** 2026-06-02
**Sprint:** 001-zaklad-galerie
**Dashboard Run:** 39

<!-- dashboard-tasks: {"Rozklik fotky do lightboxu": 172, "Dlouhý text fotky v detailu": 173, "Ovládání a zavírání lightboxu": 174} -->

## Kontext
Run 003 postavil mřížku fotek v sekci (PhotoGrid + Image náhledy). Zatím se fotka jen
zobrazí, neotvírá detail. Tento run dodá rozklik: klik na fotku otevře lightbox s velkým
obrázkem, popiskem a volitelným dlouhým textem (tělo markdownu přes `render()`). Tím je
hotové MVP sprintu 001.

## Zadání
- [ ] V PhotoGrid renderovat tělo fotky přes `render()` z astro:content (mcp)
- [ ] Klik na fotku otevře `<dialog>` lightbox: velký `<Image>`, caption, dlouhý text (jen když existuje) (mcp)
- [ ] UX: zavření přes ×, Esc (nativní dialog) i klik na pozadí; zámek scrollu na pozadí
- [ ] Build + ověřit otevření/zavření a že fotka bez těla nemá prázdný text

## Soubory ke čtení
- src/components/gallery/PhotoGrid.astro — sem přidat trigger + dialog
- src/content.config.ts — pole fotky (caption, cover, tělo)
- src/components/layout/Navbar.astro — vzor vanilla JS skriptu (astro:page-load)
