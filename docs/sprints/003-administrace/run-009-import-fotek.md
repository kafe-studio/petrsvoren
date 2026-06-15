# Run 009: Import fotek z markdownu do D1/R2

**Status:** TODO
**Date:** 2026-06-15
**Sprint:** 003-administrace
**Typ:** data migration

## Kontext

Veřejný web zatím čte fotky z **content collections** (`src/content/photos/<sekce>/*.md`
a `src/content/monthly/<RRRR-MM>/*.md`, co-located obrázky). Admin/D1 je zatím oddělený
svět: 5 galerií (sekcí) seedováno, ale **0 fotek**. Aby se nic neztratilo, je potřeba
existující fotky + popisky přenést do D1 + R2 **před** přepnutím veřejného webu na čtení
z D1 (Run 012).

Datový model: `photos` (`caption`, `bodyText`, `alt`, `month`, `r2Key`, `width`, `height`,
`sortOrder`), `photo_galleries` (M:N `photoId`↔`galleryId`, `isCover`, `sortOrder`).
Sekce-galerie už v D1 existují (slug = `street`/`lide`/`samota`/`krajina`/`cesty`).

## Zadání

- [ ] Skript projde `src/content/photos/<sekce>/*.md` — z frontmatteru `caption`,
      `section`, `order`, `coverAlt`, tělo markdownu = `bodyText` (dlouhý text na rozklik)
- [ ] Co-located obrázek (`cover`) každé fotky nahrát do **R2** (`photos/<id>.<ext>`),
      uložit `r2Key`, `width`, `height` (rozměry z obrázku)
- [ ] Vložit `photos` řádek + `photo_galleries` (zařazení do galerie dané sekce,
      `sortOrder` = `order`)
- [ ] Totéž pro `src/content/monthly/<RRRR-MM>/*.md` — navíc nastavit `month` (RRRR-MM)
- [ ] **Idempotence:** opakovaný běh nepřidá duplicity (klíč např. dle původní cesty/slugu —
      buď `ON CONFLICT`, nebo kontrola existence před insertem)
- [ ] Ověřit po importu: počty fotek dle sekce + měsíce odpovídají markdownu; web
      (stále čte z collections) beze změny

## Soubory ke čtení
- `src/content.config.ts` — schémata `photos` a `monthly` (frontmatter pole)
- `src/db/schema.ts` — `photos`, `photoGalleries`, `galleries`
- `src/pages/api/admin/upload.ts` — jak se dnes ukládá do R2 + D1 (vzor: R2 put, rozměry, MIME)
- `src/config/site.ts` — `sections` (slug ↔ galerie)
- `src/content/photos/` a `src/content/monthly/` — reálná data k importu

## Poznámky
- Skript poběží lokálně proti **remote** D1/R2 (přes wrangler / CF binding) — pozor na účet.
- Náhledy neřeší tento run (Cloudflare Images až Run 012); teď stačí originály v R2.
- Po úspěšném importu fotek lze v Run 012 bezpečně smazat kolekce `photos`+`monthly`.
