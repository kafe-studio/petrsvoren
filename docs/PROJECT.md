# petrsvoren — Petr Svoreň

## Záměr
Klidná, seriózní prezentace fotografií Petra Svoreně. Fotky rozdělené do ~5 sekcí
(např. street, lidé, samota, …), zobrazené v mřížce (linky a řádky). Každá fotka má
krátký popisek, volitelně delší text, který se dá rozkliknout. Homepage má úvodní
fotku (hero) a blok „tipů" (fotka měsíce, nová kniha, výstava). Kontakt přes Facebook
a e-mail. Nic na prodej, žádná diskuse, žádný admin — správa přes git.

## Tech stack
- Astro 6 (`@astrojs/cloudflare`) — nasazení na Cloudflare Workers
- Tailwind CSS 4 (`@tailwindcss/vite`)
- Content collections (fotky + tipy jako data)
- sharp — generování náhledů
- astro-icon (lucide / tabler)
- SEO komponenty (Seo, Schema), sitemap, RSS

## Milníky

### MVP (Sprint 001)
- [x] Branding a layout (sekce v navigaci, kontakt v patičce, hero)
- [x] Datový model fotek (sekce, krátký popisek, dlouhý text)
- [x] Galerie — mřížka fotek po sekcích
- [x] Rozklik fotky na detail s dlouhým textem

### Doladění (Sprint 002)
- [x] Blok tipů (fotka měsíce, nová kniha, výstava)
- [x] Kontakt, SEO/OG, deploy

## Stav
**Sprint:** 002 hotový — projekt kompletní dle zadání
**Hotové runy:** 001–006
**Aktuální run:** —
**Zbývá Petrovi:** reálné fotky + hero.jpg, nahradit placeholdery (e-mail, FB URL, doména)
