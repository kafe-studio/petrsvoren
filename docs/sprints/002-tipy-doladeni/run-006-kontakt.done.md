# Run 006: Kontakt a doladění

**Status:** DONE
**Date:** 2026-06-02
**Sprint:** 002-tipy-doladeni
**Dashboard Run:** 41

## Zadání
- Stránka kontaktu
- Finální ověření navigace a buildu

## Řešení
- `src/pages/kontakt.astro` → klidný kontakt: e-mail (mailto) + Facebook (astro-icon), FB s target/noopener
- Ověřeno: všechny nav cíle (5 sekcí + kontakt + homepage) se buildí, žádné 404; blog mimo navigaci

## Poznámky
- MCP nepřipojené; astro-icon ověřen z dřívějška + build.
- Web je kompletní dle zadání. Zbývá Petrovi: nahradit placeholdery (e-mail, FB URL, doména v site.ts), dodat reálné fotky + hero.jpg.
