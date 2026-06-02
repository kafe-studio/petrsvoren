# Run 006: Kontakt a doladění

**Status:** TODO
**Date:** 2026-06-02
**Sprint:** 002-tipy-doladeni
**Dashboard Run:** 41

<!-- dashboard-tasks: {"Stránka kontaktu": 177, "Finální ověření navigace a buildu": 178} -->

## Kontext
Vše ostatní hotové. Navigace odkazuje na `/kontakt/`, který zatím 404. Tento run dodá
stránku kontaktu (FB + e-mail) a finálně ověří, že žádný odkaz v navigaci nevede na 404.
Tím je web kompletní dle zadání.

## Zadání
- [ ] Stránka `src/pages/kontakt.astro` — klidný kontakt: e-mail (mailto) + Facebook, krátký text (mcp)
- [ ] Ověřit, že všechny nav odkazy (sekce + kontakt) vedou na existující stránky; blog mimo navigaci
- [ ] Finální build + smoke (žádné 404 na nav cílech)

## Soubory ke čtení
- src/config/site.ts — kontakt (email, facebook), navLinks
- src/components/layout/Footer.astro — vzor kontaktu (Icon + mailto)
- src/layouts/BaseLayout.astro — obal stránky
