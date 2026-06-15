# Sprint 003: Administrace (D1 + R2 + Cloudflare Access)

**Cíl:** Vlastní admin panel, kterým Petr intuitivně spravuje **celý web** —
především **galerie** (sekce, fotky, výběr měsíce) a **blog** (články), dál tipy
na homepage a editovatelné texty webu. Data se přesouvají z content collections
do **D1**, obrázky do **R2**. Přístup do adminu chrání **Cloudflare Access**
(Zero Trust na hraně) — bez auth kódu, bez hesel v DB. Vizuálně admin sedí na
stejný design jako web (vlastní Tailwind theme, ne daisyUI). Inspirace UI/CRUD
patternů: `podklady/zahrada` (Astro + CF Workers admin od patro-io).

## Auth: Cloudflare Access ✅ (nasazeno)

Rozhodnuto a **živé na produkci**. Self-hosted Access aplikace scopovaná na cesty
`/admin` a `/api/admin` (veřejný web na stejném hostu zůstává bez login wall).

- **App:** „Petr Svoreň – admin", id `56ab38ae-f301-44d5-a766-a7cb55552771`
- **Team / auth doména:** `kafestudio.cloudflareaccess.com`
- **AUD tag:** `e852b2b0ba0d84ee7e4d7fd5077275a70809cb5f44d84d731418c9fa762879f9`
- **Destinations:** `petrsvoren.ukazka.workers.dev/admin`,
  `petrsvoren.ukazka.workers.dev/api/admin`
- **Povolené e-maily (policy „Petr admin"):** `pfencl@gmail.com`,
  `google@kafe.studio`, `kacirek.jiri@gmail.com`
- **IdP:** Google + One-time PIN (org má i Authelia).
- Ověřeno: `/admin` a `/api/admin/*` → 302 na Access login; `/` a `/mesic/` → 200.

> **Zbývá (Run 007):** v `src/middleware.ts` **validovat JWT** z hlavičky
> `Cf-Access-Jwt-Assertion` proti JWKS (`https://kafestudio.cloudflareaccess.com/
> cdn-cgi/access/certs`) a kontrolovat `aud` = AUD tag výše. Bez toho by šel
> header teoreticky podvrhnout (edge ochrana sama o sobě stačí, ale validace je
> defense-in-depth a doporučuje ji i Cloudflare). AUD ulož jako wrangler
> var/secret, nehardcoduj natvrdo.

> **Pozn.:** **Cloudflare Access je dočasné řešení.** Cílově se přístup do adminu
> přesune na **better-auth** (vlastní login na vlastní doméně, bez závislosti na
> Zero Trust týmové doméně). `better-auth` proto **zůstává v `package.json`** —
> NEodinstalovávat. Než se zprovozní, drží přístup CF Access + JWT middleware.

## Rozhodnutí (zadání)

- **Úložiště:** strukturovaná data (galerie, fotky, blog, tipy, texty) → **D1**;
  originály obrázků → **R2**. Veřejný web čte z DB.
- **Auth:** **Cloudflare Access** (viz výše) — jeden okruh povolených e-mailů,
  žádná registrace, žádné heslo v aplikaci.
- **Náhledy/optimalizace:** `sharp` ve Workers neběží. Náhledy řeší **Cloudflare
  Images / Image Resizing** na hraně. MVP servíruje originály z R2 přes
  `/img/[id]` + lazy-load; resize je follow-up v rámci sprintu.
- **Blog:** přesouvá se z markdownu v gitu do **D1** + rich-text editor, aby byl
  editovatelný z adminu (požadavek: spravovat blog stejně pohodlně jako galerie).
- **Vizuál:** admin má vlastní shell (`AdminLayout` se sidebarem) postavený na
  design tokenech webu (`src/styles/global.css`: `--color-background`,
  `--color-card`, `--color-border`, `--color-primary`, `--color-muted-foreground`,
  `.glass`, light/dark přes `data-theme`). Žádný daisyUI.
- **Sveltia CMS:** odstraněno (`public/admin/`) — lokálně hotovo, **chybí deploy**
  (viz Stav).

## Datový model (D1 / Drizzle)

Existující (`src/db/schema.ts`): `galleries`, `photos` (vč. `month` pro výběr
měsíce), `photo_galleries` (M:N + `isCover` + `sortOrder`), `site_texts`.

Doplnit v tomto sprintu:

- **`blog_posts`** — `id`, `slug` (unique), `title`, `description`, `author`,
  `coverR2Key` (R2), `coverAlt`, `bodyDoc` (JSON z editoru), `bodyHtml`
  (vyrenderované HTML pro veřejný web), `tags` (JSON array), `category`,
  `pubDate`, `published` (boolean, draft-first), `sortOrder`, `createdAt`.
- **`tips`** — `id`, `title`, `imageR2Key` (volitelné), `link` (volitelné),
  `active` (boolean), `sortOrder`, `createdAt`. (Homepage upoutávky.)

> Auth nevyžaduje žádné DB tabulky — řeší CF Access mimo aplikaci.
> Mapování na dnešní obsah: `photos` pokrývá kolekce `photos` (sekce přes
> `photo_galleries`) i `monthly` (přes pole `month`). `blog_posts` nahradí kolekci
> `blog`, `tips` nahradí kolekci `tips`. Sekce zůstávají i v `src/config/site.ts`.

## Stav: co už je hotové ✅

- **Cloudflare Access** nasazen (viz sekce Auth) — `/admin` a `/api/admin`
  chráněné na hraně.
- D1 + **Drizzle ORM** schema (galleries, photos, photo_galleries, site_texts),
  migrace `drizzle/migrations/0000_*.sql`, `drizzle.config.ts` (d1-http remote),
  klient `src/db/index.ts` (`getDb()` přes `cloudflare:workers`).
- **R2** binding `PHOTOS`, serving `/img/[id]` (1 rok cache, etag, MIME z R2).
- **Upload** do R2 (`/api/admin/upload`) — drag-drop, EXIF (`exifr`), rozměry,
  dávkový upload (zatím vanilla JS).
- **CRUD** galerií a fotek (M:N, `isCover`, mazání s úklidem R2). Dashboard
  `/admin` s počty.
- **Sveltia** smazána lokálně (`public/admin/`).

> ⚠️ **Necommitnuto / nenasazeno:** smazání Sveltie + CRUD galerií/fotek jsou
> jen v pracovní kopii. Na produkci běží commit `be5e19c`, který **stále
> obsahuje `public/admin/index.html`** — a statický soubor z `public/` překryje
> SSR routu `/admin/`, proto je tam pořád vidět Sveltia. **Fix = commit + deploy.**
> Stávající admin stránky mají v hlavičce neaktuální komentář „chrání Cloudflare
> Access" — teď už to platí, ale formulaci při refaktoru sjednotit.

## Runy

- [x] **Run 007 — Admin auth, shell & deploy** (additive)
  → docs/sprints/003-administrace/run-007-access-shell.done.md
  AdminLayout se sidebarem + přesun 5 admin stránek z `BaseLayout`; toast
  (`admin-toast.ts`+`Toaster.astro`) + `DeleteButton.astro` (vanilla); `admin-helpers.ts`
  (sdílené CRUD helpery). **Auth pivot:** CF Access JWT nahrazeno in-app loginem
  jméno+heslo (PBKDF2 + session cookie) — viz done.md. Nasazeno.

- [ ] **Run 008 — Galerie & fotky: intuitivní správa** (refactor)
  Upload i editaci přepsat na Svelte 5 islands (props ze serveru). `ImagePicker`,
  drag-drop **řazení** fotek v galerii (`sortOrder` přes `db.batch`), nastavení
  `isCover`, hromadné akce, UI pro **výběr měsíce** (`month`). Cíl: spravovat
  galerie bez přemýšlení.

- [ ] **Run 009 — Blog do D1 + rich text** (additive → pak destructive)
  Schema `blog_posts` + migrace; rich-text editor (ProseKit: JSON + HTML);
  cover přes `ImagePicker`/R2; admin `/admin/blog` (+ `[id]`), API přes CRUD
  factory; draft/publish. Seed: import stávajících `src/content/blog/*.md`.

- [ ] **Run 010 — Tipy + texty webu** (additive)
  Schema `tips` + migrace, `site_texts` UI (skupinová editace jako zahrada
  `texty/[group]`). Admin `/admin/tipy`, `/admin/texty`. Seed ze stávající
  kolekce `tips`.

- [ ] **Run 011 — Veřejný web čte z D1 + náhledy** (destructive)
  Helpery pro dotazy (fotky dle sekce, výběr měsíce, blog, tipy, texty); přepis
  `[section].astro`, `index.astro`, `Tips.astro`, `PhotoGrid.astro`,
  `Schema.astro`, `/mesic/`, `/blog/`. **Cloudflare Images / Image Resizing**
  pro náhledy. **KV cache** + invalidace. Odstranit kolekce `photos`, `monthly`,
  `tips`, `blog` z `content.config.ts` a `src/content/` (blog až po Run 009 seedu).

- [ ] **Run 012 — Doladění & deploy** (ops)
  Remote D1/R2 (přes CF plugin / wrangler), apply migrací `--remote`; nastavit
  Cloudflare Images binding; observability; review, finální deploy a ověření.

## Cloudflare možnosti (CF plugin)

Plugin `cloudflare` je v session připojený — `mcp__plugin_cloudflare_*`
(cloudflare-bindings: D1/R2/KV/Workers + docs search; -builds; -observability).
Access/Zero Trust plugin nespravuje → řešeno přes REST API (`/access/apps`,
`/access/policies`) s tokenem `Access: Apps and Policies Write`. Napříč runy:

- **Cloudflare Access** — auth na hraně (✅ nasazeno).
- **Cloudflare Images / Image Resizing** — náhledy a varianty velikostí (řeší
  absenci `sharp` ve Workers); originály zůstávají v R2.
- **KV** — cache veřejných dotazů, invalidace klíčů (`<prefix>:list`) při zápisu.
- **R2** — originály obrázků; serving přes `/img/[id]` nebo (cílově) veřejná
  custom doména s edge cache + `/api/media` fallback.
- **D1** — strukturovaná data; live správa přes `cloudflare-bindings` MCP.
- **Observability / Builds** — logy a deploy pipeline.

## Poznámky / rizika

- **Docs-first (CLAUDE.md):** před psaním kódu Astro/Svelte/Drizzle/ProseKit/
  Workers ověřit přes D1 docs-DB (`cloudflare-bindings`), fallback `worker-mcp`,
  jinak `context7`. Pro CF Access JWT validaci ověřit aktuální postup (JWKS URL,
  `jose`/`@tsndr/cloudflare-worker-jwt` na Workers runtime). Žádný kód z paměti.
- **Forbidden patterns:** Svelte 5 runes only, `$props()`, `onclick`, žádné
  `as any`/`@ts-ignore`, bindings přes `cloudflare:workers`.
- **Po změně wrangleru** (D1/R2/Images): `pnpm build` (regenerace
  `worker-configuration.d.ts`).
- **Migrace remote:** `wrangler d1 migrations apply <db> --remote`.
- **Blog migrace:** seed z markdownu spustit **před** odstraněním blog kolekce.
- **Access lokálně:** dev nemá `Cf-Access-Jwt-Assertion` → middleware musí mít
  dev bypass (jinak nejde admin testovat lokálně).
