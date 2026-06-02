# Run 004: Rozklik fotky

**Status:** DONE
**Date:** 2026-06-02
**Sprint:** 001-zaklad-galerie
**Dashboard Run:** 39

## Zadání
- Render těla fotky přes render()
- Klik otevře lightbox (velký obrázek, caption, dlouhý text)
- UX: ×, Esc, pozadí, zámek scrollu

## Řešení
- `PhotoGrid.astro`: `render()` předrenderuje tělo, `hasText` gate; klik na fotku → nativní `<dialog>` (showModal)
- Lightbox: velký `<Image>`, caption vždy, dlouhý text jen když existuje; zavření × (form method=dialog) / Esc / klik na pozadí; scroll-lock přes `close` event
- Validní markup: `button > span > img`, `figcaption` sourozenec

## Poznámky
- MCP servery nepřipojené; `render()` ověřen přes oficiální Astro docs + build artefakt (showModal a tělo v outputu).
- `dialogId` dle indexu — unikátní v rámci stránky (jedna mřížka/stránka); pozor při dvou mřížkách na jedné stránce.
- Bez Playwright (MCP nedostupné) ověřeno na build artefaktu, ne živým klikem.
