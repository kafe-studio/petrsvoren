# Run 007 — Access JWT middleware, admin shell & deploy

**Sprint:** 003-administrace
**Typ:** additive
**Stav:** in_progress

## Cíl

Defense-in-depth k edge ochraně Cloudflare Access + vlastní admin shell a
sjednocené UX primitivy. Na konci commit + deploy.

## Zadání

1. **Access JWT validace** (mcp)(bp) — `src/lib/access.ts` (`verifyAccessJwt` přes
   `jose` `createRemoteJWKSet`) + `src/middleware.ts` (`onRequest`, chrání `/admin`
   a `/api/admin`, dev bypass) + wrangler vars `CF_ACCESS_AUD`,
   `CF_ACCESS_TEAM_DOMAIN`.
2. **AdminLayout shell** (mcp)(bp) — `src/layouts/AdminLayout.astro` se sidebarem na
   design tokenech webu; migrace 5 admin stránek z `BaseLayout`.
3. **Admin UX** (mcp)(bp) — `src/lib/admin-toast.ts` + `Toaster.svelte` +
   `DeleteButton.svelte` (Svelte 5 islands, potvrzení + fetch DELETE).
4. **admin-helpers.ts** (bp) — sdílené CRUD helpery (JSON parse, error responses,
   method guard); zapojení do API rout galleries/photos.
5. ~~Úklid — odinstalovat better-auth~~ **ZRUŠENO** — better-auth se ponechává,
   je to cílová auth (vlastní login na vlastní doméně). CF Access + JWT middleware
   je dočasný stopgap, než se better-auth zprovozní.

## Plánovaná struktura

| Soubor | ~ř | Odpovědnost |
|--------|----|-------------|
| `src/lib/access.ts` | 70 | JWT verifikace proti JWKS, kontrola `aud` |
| `src/middleware.ts` | 60 | route guard, dev bypass |
| `src/layouts/AdminLayout.astro` | 120 | admin shell + sidebar |
| `src/lib/admin-toast.ts` | 40 | toast event helper |
| `src/components/admin/Toaster.svelte` | 60 | toast island |
| `src/components/admin/DeleteButton.svelte` | 60 | delete + confirm island |
| `src/lib/admin-helpers.ts` | 110 | CRUD helpery pro API routy |

## Poznámky

- Dashboard registrace runu selhala (Sprint 003 bez dashboard sprint ID) — WARNING,
  pokračováno bez registrace.
- `better-auth` zatím není importován, ale ZŮSTÁVÁ v `package.json` — je to cílová
  auth (vlastní doména). Neodinstalovávat.
