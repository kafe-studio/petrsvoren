# Run 008: Galerie & fotky — intuitivní správa

**Status:** TODO
**Date:** 2026-06-15
**Sprint:** 003-administrace
**Typ:** refactor

## Kontext

Sprint 003 etapy 1–3 + Run 007 hotové a nasazené: D1 + R2, upload, CRUD galerií/fotek,
admin shell (`AdminLayout` se sidebarem), toast + `DeleteButton`, sdílené CRUD helpery
(`src/lib/admin-helpers.ts`). Auth = in-app login jméno+heslo (PBKDF2 + session cookie,
`src/lib/auth.ts` + `src/middleware.ts`); účty `kacirek`, `petr` v `admin_users`.

Admin je dnes **vanilla JS** (inline `<script>` v Astro stránkách). Cíl Run 008: přepsat
správu galerií a fotek na **Svelte 5 islands**, ať jde spravovat „bez přemýšlení" —
drag-drop řazení, hromadné akce, ImagePicker. **Svelte zatím není v projektu** → první
úkol je integrace.

## Zadání

- [ ] Integrovat Svelte 5 do projektu — `@astrojs/svelte`, `astro.config` integration,
      `svelte.config.js`, ověřit build na Workers (mcp)
- [ ] Upload přepsat z vanilla na Svelte 5 island (props ze serveru, runes only) (mcp)
- [ ] Editace fotky (`/admin/photos/[id]`) → Svelte 5 island: galerie/cover/měsíc/EXIF (mcp)
- [ ] Drag-drop **řazení** fotek v galerii (`sortOrder` přes `db.batch`) + `ImagePicker`
      + nastavení `isCover` + hromadné akce + UI pro výběr měsíce (`month`) (mcp)
- [ ] Fix carry-over: `galleries.astro` textarea předvyplňuje bílými znaky
      (`{g.description}` v odsazení uvnitř `<textarea>`)
- [ ] Úklid carry-over: sekce sprint.md „Auth: Cloudflare Access" je po pivotu neaktuální
      → přepsat na in-app login (jméno+heslo, PBKDF2, session cookie)

> Pozn.: max 5 items na run — `/work` vybere podmnožinu. Svelte integrace + 1–2 islands
> jako jeden run; zbytek (drag-drop, hromadné akce, carry-overy) případně do navazujícího.

## Soubory ke čtení
- `src/db/schema.ts` — `photos` (`sortOrder`, `month`), `photoGalleries` (`isCover`, `sortOrder`)
- `src/pages/admin/upload.astro` — stávající vanilla upload (drag-drop, EXIF, dávka)
- `src/pages/admin/photos/[id].astro` — stávající vanilla editor (galerie/cover/měsíc)
- `src/pages/api/admin/photos/[id].ts` — PATCH (zařazení do galerií, cover, sortOrder)
- kafe-stack skill `svelte5` + `astro` — runes only, islands, `client:*` direktivy
