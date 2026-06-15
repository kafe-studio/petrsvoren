# Run 007: Admin auth, shell & deploy

**Status:** DONE
**Date:** 2026-06-15
**Sprint:** 003-administrace

## Zadání
- Ochrana adminu na úrovni middleware (původně CF Access JWT)
- AdminLayout shell se sidebarem + migrace 5 admin stránek z BaseLayout
- Admin UX: toast + DeleteButton (vanilla; Svelte islands až Run 008)
- admin-helpers.ts: sdílené CRUD helpery pro /api/admin
- Ponechat better-auth (cílová auth), úklid

## Řešení
- Admin shell `src/layouts/AdminLayout.astro` (sidebar) + 5 stránek přepnuto z BaseLayout
- Toast (`src/lib/admin-toast.ts` + `components/admin/Toaster.astro`) + `DeleteButton.astro`, zapojeno do galleries + photos/[id]
- CRUD helpery `src/lib/admin-helpers.ts` (jsonError/jsonOk/parseJsonBody/slugify) ve 4 API routách
- Logout opraven na `POST /api/auth/logout` v AdminLayout

## Poznámky
- **Auth pivot uprostřed runu (Petr, commit 2f5d0fd):** CF Access JWT (jose) nahrazeno in-app loginem jméno+heslo (PBKDF2 + HMAC session cookie). Proto smazán `src/lib/access.ts` + dep `jose`, logout přepojen z `/cdn-cgi/access/logout` na API (commit 55d3ddc).
- better-auth zůstává v package.json (zatím nepoužitý, ale cílová auth — neodinstalovávat). Sekce sprint.md „Auth: Cloudflare Access" je teď neaktuální — projít při Run 008.
- Pre-existing WARNING: `galleries.astro` textarea předvyplní bílými znaky (`{g.description}` v odsazení) — fix v Run 008.
