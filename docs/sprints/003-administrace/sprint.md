# Sprint 003: Administrace (D1 + better-auth)

**Cíl:** Vlastní admin panel místo Sveltia CMS. Data fotek a tipů se přesunou
z content collections do D1, obrázky do R2. Login e-mailem + heslem (jeden účet
— Petr) přes better-auth. Plný CRUD na fotky a tipy.

## Rozhodnutí (zadání)
- **Úložiště:** fotky a tipy → D1, obrázky → R2. Veřejný web čte z DB.
- **Login:** better-auth, e-mail + heslo, jeden admin. Žádné registrace.
- **Sveltia:** odstranit (`public/admin/`, `config.yml`).
- Blog kolekce zůstává v gitu (markdown), nedotýkáme se jí.

## Runy

- [ ] **Run 007 — Datová vrstva & auth backend** (additive, nic nerozbije)
  D1 + R2 binding ve wrangleru, Drizzle schema (better-auth tabulky + photos + tips),
  drizzle.config, better-auth server config (email+password), migrace + lokální apply,
  seed: stávající fotky/tipy + admin uživatel.

- [ ] **Run 008 — Veřejný web čte z D1** (destructive)
  Helpery pro dotazy (fotky dle sekce, tipy), přepis `[section].astro`, `index.astro`,
  `Tips.astro`, `PhotoGrid.astro`, `Schema.astro`. Media route `/media/[...key]` z R2.
  Odstranit photos+tips z `content.config.ts` a `src/content/`. Odstranit Sveltia.

- [ ] **Run 009 — Admin: login + layout**
  better-auth handler `/api/auth/[...all]`, middleware ochrana `/admin/**`,
  login stránka, AdminLayout (sidebar), dashboard, logout.

- [ ] **Run 010 — Admin: CRUD fotek**
  Seznam, formulář nová/úprava (Svelte 5), upload obrázku do R2, mazání (+ R2 objekt),
  API `/api/admin/photos`.

- [ ] **Run 011 — Admin: CRUD tipů + doladění + deploy**
  Tipy CRUD, polish, review, vytvoření remote D1/R2, apply migrací remote, deploy.

## Poznámky / rizika
- **sharp neběží ve Workers** → runtime náhledy nelze generovat jako při buildu.
  MVP: servírovat originály z R2 + lazy-load. Optimalizace (Cloudflare Images /
  image resizing) jako pozdější follow-up.
- Po přidání D1/R2 do wrangleru je nutný `pnpm build` (regenerace typů `worker-configuration.d.ts`).
- Migrace remote: `wrangler d1 migrations apply <db> --remote` (bez `--remote` jen lokálně).
- before-auth/drizzle/astro kód: ověřit přes kafe-stack skills před psaním.
