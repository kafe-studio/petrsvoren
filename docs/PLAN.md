# Plan: petrsvoren

**Vytvořeno:** 2026-06-02
**Aktualizováno:** 2026-06-02 (Run 005 hotový)

## Cíl
Klidná fotoprezentace Petra Svoreně: homepage s úvodní fotkou, fotky rozdělené do ~5
sekcí v mřížce, krátký popisek u fotky s možností rozkliknutí na delší text, blok tipů
a kontakt přes FB + e-mail. Vše statické na content collections, nasazené na Cloudflare.

## Sprinty

### Sprint 001: Základ a galerie (MVP)
**Stav:** hotovo
**Cíl:** Použitelná fotoprezentace — homepage, sekce, mřížka fotek, rozklik na dlouhý text.

- [x] Run 001 — Branding & layout (config, Navbar, Footer, hero) → docs/sprints/001-zaklad-galerie/run-001-branding-layout.done.md
- [x] Run 002 — Datový model fotek (collection, sharp náhledy, ukázky) → docs/sprints/001-zaklad-galerie/run-002-datovy-model.done.md
- [x] Run 003 — Galerie: přehled sekcí + mřížka fotek v sekci → docs/sprints/001-zaklad-galerie/run-003-galerie.done.md
- [x] Run 004 — Rozklik fotky: lightbox/modal s dlouhým textem → docs/sprints/001-zaklad-galerie/run-004-rozklik.done.md

### Sprint 002: Tipy a doladění
**Cíl:** Aktuality, kontakt, SEO, nasazení.

- [x] Run 005 — Blok „Tipy" (fotka měsíce, nová kniha, výstava) → docs/sprints/002-tipy-doladeni/run-005-tipy.done.md
- [ ] Run 006 — Kontakt (FB + e-mail), SEO/OG/Schema pro fotky, doladění + deploy → docs/sprints/002-tipy-doladeni/run-006-kontakt.md

## Poznámky
- Vše na content collections → správa přes git, fotky do `public/` nebo přímo do kolekce,
  sharp generuje náhledy. Žádná DB, žádné R2/D1.
- Úvodní (hero) fotku dodá Petr; do té doby placeholder.
- Sekce definované jako pole v configu — přidání/přejmenování = jeden řádek.
- Kostra je blog-based; blog kolekci ponecháváme, ale v navigaci ji nahradíme sekcemi.
