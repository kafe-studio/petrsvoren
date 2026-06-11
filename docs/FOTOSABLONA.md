# Fotoprezentace — příručka pro nového autora

Tahle šablona je hotová fotoprezentace (galerie + blog). Postavená na Astro 6 +
Cloudflare Workers, obsah se spravuje přes git — žádná databáze, žádný admin.

Tento dokument popisuje **vše, co je potřeba změnit, aby web sloužil jinému autorovi**.

---

## Co web umí

- **Homepage** s úvodní fotkou (hero) a blokem „tipů" (aktuality — výstava, kniha…)
- **5 sekcí galerie** (výchozí: Street, Lidé, Samota, Krajina, Cesty) — počet i názvy se mění v configu
- **Mřížka fotek** v každé sekci, rozklik na **velký náhled (lightbox)** s:
  - listováním na další/předchozí (boční šipky + klávesy ←/→, dokola)
  - zobrazením v **plné velikosti** (přes celou obrazovku)
  - **posuvníkem pozadí náhledu** od černé po bílou (volba se pamatuje)
  - zavřením křížkem / Esc / klikem na pozadí
- **Fotka v pozadí** všech stránek (jemná, průhledná)
- **Blog** s content collections
- **Kontakt**, **SEO** (meta, Open Graph, JSON-LD), **sitemap**, **RSS**, **robots.txt**

---

## Rychlý start — checklist

1. [ ] `src/config/site.ts` — jméno, popis, URL, e-mail, sociální sítě, sekce
2. [ ] `public/hero.jpg` — úvodní fotka homepage
3. [ ] `public/bg.jpg` — fotka v pozadí stránek
4. [ ] `public/og-image.png` — náhled při sdílení (1200×630)
5. [ ] `public/favicon.svg` — ikona webu
6. [ ] `src/content/photos/` — nahradit fotky a popisky (viz níže)
7. [ ] `src/content/tips/` — aktuality na homepage (nebo `active: false`)
8. [ ] `src/content/blog/` — smazat ukázku, přidat vlastní (nebo nechat prázdné)
9. [ ] `wrangler.jsonc` — `name` workeru + doména
10. [ ] `package.json` — `name` projektu

> Tip: placeholder fotky mají v hlavičce `.md` komentář
> `# placeholder fotka … nahradit … originálem`. Podle něj poznáš, co vyměnit.

---

## 1. Branding — `src/config/site.ts`

Jediný soubor pro základní identitu webu.

```ts
export const sections = [
  { slug: "street", title: "Street" },
  { slug: "lide",   title: "Lidé" },
  // … přidej / uber / přejmenuj řádek = přidá/ubere sekci v navigaci i galerii
] as const;

export const siteConfig = {
  name: "Jméno Autora",
  description: "Krátký popis tvorby.",
  url: "https://autor.example.com/",   // produkční doména (i pro sitemap/RSS)
  lang: "cs",
  locale: "cs_CZ",
  author: "Jméno Autora",
  ogImage: "/og-image.png",
  email: "autor@example.com",          // zobrazí se na Kontaktu i v patičce
  socialLinks: { facebook: "https://www.facebook.com/…" },
  sections,
};
```

- **Sekce**: `slug` = část URL (`/street/`), `title` = popisek v menu. Pořadí pole = pořadí v navigaci.
  Změna sekcí se sama promítne do navigace, patičky, homepage i validace fotek.
- **`url`** je zdroj pravdy pro doménu — `astro.config.mjs` ji importuje (sitemap, RSS, kanonické odkazy).

---

## 2. Obrázky v `public/`

| Soubor | K čemu | Doporučení |
|---|---|---|
| `hero.jpg` | Velká fotka na homepage | na šířku, výrazná, ~2000 px |
| `bg.jpg` | Fotka v pozadí všech stránek | klidnější, na šířku |
| `og-image.png` | Náhled při sdílení na sítích | přesně **1200×630** |
| `favicon.svg` | Ikona v záložce | jednoduché SVG |

Soubory v `public/` se servírují tak, jak jsou (neoptimalizují se). Drž je rozumně velké.

---

## 3. Fotky galerie — `src/content/photos/`

Jedna fotka = **jeden `.md` soubor + obrázek vedle něj**. Doporučení: ~8 fotek na sekci.

```markdown
---
section: street                      # musí být slug ze site.ts
caption: "Krátký popisek pod fotkou"
cover: "./moje-fotka.jpg"            # obrázek ve stejné složce
coverAlt: "Popis fotky pro čtečky / SEO"
order: 1                             # pořadí v sekci (1, 2, 3…)
---

Volitelný delší text, který se ukáže ve velkém náhledu po rozkliknutí.
Když ho vynecháš, v náhledu se zobrazí jen fotka a popisek.
```

- **`cover`** prochází optimalizací (`astro:assets`) → generují se WebP varianty automaticky.
- **`order`** řídí pořadí v mřížce i listování v náhledu.
- Delší text v těle `.md` je volitelný; ukáže se ve velkém náhledu pod fotkou
  (kompaktně, se stropem výšky, ať se vše vejde do okna).

Přidání fotky = zkopíruj obrázek do `src/content/photos/`, vytvoř k němu `.md`. Hotovo.

---

## 4. Tipy na homepage — `src/content/tips/`

Bloky „Aktuálně" na homepage (fotka měsíce, nová kniha, výstava…).

```markdown
---
title: "Výstava: Ticho ve městě"
image: "./vystava.jpg"   # volitelné (bez něj jen text)
link: "https://…"        # volitelné tlačítko „Více →"
order: 1
active: true             # false = skryje tip bez mazání
---

Text upoutávky.
```

Žádný aktivní tip = celý blok „Aktuálně" na homepage zmizí.

---

## 5. Blog — `src/content/blog/`

```markdown
---
title: "Nadpis článku"
description: "Krátký popis (do náhledu a SEO)."
pubDate: 2026-05-20
author: "Jméno Autora"
tags: ["téma"]        # volitelné
---

Tělo článku v Markdownu.
```

Prázdná složka = blog ukáže „Zatím žádné články". (Aspoň jeden článek odstraní build warning.)

---

## 6. Velký náhled (lightbox) — `src/components/gallery/PhotoGrid.astro`

Veškerá logika náhledu je v jednom souboru. Náhled **vyplňuje celé okno prohlížeče**
(flex sloupec: lišta + fotka + popisek a text + pás), fotka pružně zabere zbylé místo
a celá se vejde — **nic nepřetéká a nejsou tam žádné posuvníky** (`.lb-dialog { overflow: hidden }`).
Funkce:

- **Listování** — boční šipky + klávesy ←/→, dokola; počítadlo „X / N".
- **Popisek a text** — pod fotkou; delší text má strop výšky (`.lb-meta { max-height: 30vh }`),
  aby se vše vešlo do okna bez posuvníku.
- **Plná velikost** — klik na fotku nebo ikona lupy roztáhne náhled přes celou obrazovku
  (CSS třída `lb-full`); opětovný klik vrátí do náhledu. Listuje-li se v plné velikosti,
  každá další fotka se zobrazí rovnou taky v plné velikosti.
- **Pás náhledů** — pod fotkou (jen v náhledu, ne v plné velikosti) je vodorovný pás
  všech fotek sekce. Výchozí krytí je 5 % (`opacity: 0.05`) — pás je sotva znatelný,
  po najetí myší se fotka rozsvítí naplno, kliknutím se zobrazí. Aktuální je zvýrazněná rámečkem.
- **Posuvník pozadí** — táhlo v horní liště nastaví pozadí náhledu proporcionálně
  od černé (0) po bílou (100). Ovládá se **jen myší** (`tabindex="-1"`), aby klávesy
  ←/→ vždy sloužily listování. Hodnota se ukládá do `localStorage` (klíč `lb-bg`)
  a platí pro všechny fotky. Pozadí řídí proměnné `--lb-bg` / `--lb-fg` na `<html>`;
  text i ovládání se automaticky přebarví na kontrastní odstín.
- **Zavření** — křížek nebo Esc; vrátí zpět do galerie.

Co se dá snadno doladit (vše v tom souboru):

| Chci změnit | Kde |
|---|---|
| Výchozí pozadí náhledu | `value="6"` u `input[data-lb-bg]` a fallback `--lb-bg` ve `<style>` |
| Práh přepnutí světlý/tmavý text | `g < 140` ve funkci `applyLightboxBg` |
| Layout náhledu (vždy přes celé okno) | `.lb-dialog` (flex sloupec, `overflow: hidden`) + `.lb-stage` (`flex: 1`) |
| Co skrýt v plné velikosti | `dialog.lb-full .lb-strip, dialog.lb-full .lb-meta { display: none }` |
| Strop výšky textu pod fotkou | `.lb-meta { max-height: 30vh }` |
| Výška náhledů v pásu | `.lb-thumb img` (`h-12 sm:h-14`) |
| Krytí pásu náhledů | `.lb-thumb { opacity: 0.05 }` (hover `1`) |
| Vzhled šipek | třídy u tlačítek `data-nav` |

---

## 7. Fotka v pozadí stránek — `src/layouts/BaseLayout.astro`

Pevná vrstva přes celý viewport, pod obsahem:

```html
<div class="… fixed inset-0 z-0 … opacity-10"
     style="background-image: url('/bg.jpg');" aria-hidden="true"></div>
```

- **Výraznost** = třída `opacity-10` (0.1 = jemné). Silnější `opacity-20`, slabší `opacity-5`.
- Obrázek = `public/bg.jpg`.

---

## 8. Deploy — Cloudflare Workers

Web se nasazuje **automaticky při `git push` na `main`** (Cloudflare Workers Builds
napojený na GitHub). Není potřeba ručně deployovat.

V `wrangler.jsonc` nastav:

- `name` — název workeru (= součást `*.workers.dev` URL)
- doménu (route / custom domain), pokud má web běžet na vlastní adrese

Lokální vývoj a kontrola:

```bash
pnpm dev      # lokální náhled (http://localhost:4321)
pnpm build    # produkční build (ověří, že vše projde)
```

---

## 9. Co určitě nahradit (placeholdery)

- E-mail a Facebook URL v `src/config/site.ts`
- `url` (doména) v `src/config/site.ts`
- `public/hero.jpg`, `public/bg.jpg`, `public/og-image.png`, `public/favicon.svg`
- Všechny fotky v `src/content/photos/` označené komentářem `# placeholder fotka …`
- Ukázkový blog článek v `src/content/blog/`

Po nahrazení spusť `pnpm build` — projde-li bez chyb, je web připravený k nasazení.
