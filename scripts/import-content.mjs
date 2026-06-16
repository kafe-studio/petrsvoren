// Jednorázová migrace souborového obsahu (content collections) → D1 + R2.
// Čte src/content/{photos,monthly,tips,blog}, spočítá rozměry (sharp),
// vygeneruje:
//   /tmp/pv-import.sql  — INSERT OR REPLACE pro D1 (galleries, photos,
//                         photo_galleries, tips, articles, site_texts)
//   /tmp/pv-r2.sh       — wrangler r2 object put pro každý obrázek
// ID jsou deterministické (sha1 cesty) → skript je idempotentní (re-run přepíše).
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

const ROOT = resolve(import.meta.dirname, "..");
const C = join(ROOT, "src/content");
const BUCKET = "petrsvoren-photos";
const NOW = Math.floor(Date.now() / 1000);

const sections = [
  { slug: "street", title: "Street" },
  { slug: "lide", title: "Lidé" },
  { slug: "samota", title: "Samota" },
  { slug: "krajina", title: "Krajina" },
  { slug: "cesty", title: "Cesty" },
];

const idOf = (rel) => createHash("sha1").update(rel).digest("hex");
const esc = (v) =>
  v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`;

// Minimalistický parser frontmatteru (jen co potřebujeme: string/number/bool/array/date).
function parse(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: md.trim() };
  const data = {};
  for (const line of m[1].split("\n")) {
    const mm = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!mm) continue;
    const key = mm[1];
    let raw = mm[2].trim();
    if (raw === "") continue;
    if (raw.startsWith("#")) continue;
    if (/^\[.*\]$/.test(raw)) {
      data[key] = raw
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (raw === "true" || raw === "false") {
      data[key] = raw === "true";
    } else if (/^-?\d+(\.\d+)?$/.test(raw)) {
      data[key] = Number(raw);
    } else {
      data[key] = raw.replace(/^["']|["']$/g, "").replace(/#.*$/, "").trim();
    }
  }
  return { data, body: m[2].trim() };
}

async function dims(file) {
  try {
    const meta = await sharp(file).metadata();
    let w = meta.width ?? null;
    let h = meta.height ?? null;
    if ([5, 6, 7, 8].includes(meta.orientation) && w && h) [w, h] = [h, w];
    return { w, h };
  } catch {
    return { w: null, h: null };
  }
}

// Najde co-located obrázek pro .md (podle cover/image pole nebo stejného basename).
function imageFor(mdPath, coverField) {
  const dir = dirname(mdPath);
  if (coverField) {
    const p = join(dir, coverField.replace(/^\.\//, ""));
    if (existsSync(p)) return p;
  }
  const base = basename(mdPath, ".md");
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    const p = join(dir, `${base}.${ext}`);
    if (existsSync(p)) return p;
  }
  return null;
}

// Rekurzivně posbírá .md soubory.
function mdFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...mdFiles(p));
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out;
}

const sql = [];
const r2 = ["#!/usr/bin/env bash", "set -e"];
const ACCT = "CLOUDFLARE_ACCOUNT_ID=b945870b3bb5d6a40266336cb1e88693";
const put = (key, file) =>
  r2.push(
    `${ACCT} npx wrangler r2 object put ${BUCKET}/${key} --file=${esc(file).slice(1, -1)} --content-type=image/jpeg --remote`,
  );

let nImg = 0;

// ── Galerie (sekce) ───────────────────────────────────────────────────────────
sections.forEach((s, i) => {
  sql.push(
    `INSERT OR REPLACE INTO galleries (id,slug,title,description,sort_order,created_at) VALUES (${esc("gal-" + s.slug)},${esc(s.slug)},${esc(s.title)},NULL,${i},${NOW});`,
  );
});

// ── Fotky v sekcích ───────────────────────────────────────────────────────────
const photoFiles = mdFiles(join(C, "photos"));
const bySection = new Map(sections.map((s) => [s.slug, []]));
for (const f of photoFiles) {
  const { data, body } = parse(readFileSync(f, "utf8"));
  const img = imageFor(f, data.cover);
  if (!img || !data.section) continue;
  const rel = f.slice(ROOT.length + 1);
  const id = idOf(rel);
  const key = `photos/${id}.jpg`;
  const { w, h } = await dims(img);
  sql.push(
    `INSERT OR REPLACE INTO photos (id,r2_key,caption,body_text,alt,month,show_exif,exif_json,width,height,sort_order,created_at) VALUES (${esc(id)},${esc(key)},${esc(data.caption ?? "")},${esc(body || null)},${esc(data.coverAlt ?? null)},NULL,0,NULL,${w ?? "NULL"},${h ?? "NULL"},${data.order ?? 0},${NOW});`,
  );
  put(key, img);
  nImg++;
  bySection.get(data.section)?.push({ id, order: data.order ?? 0 });
}
// Zařazení do galerií + cover = fotka s nejnižším order.
for (const [slug, arr] of bySection) {
  arr.sort((a, b) => a.order - b.order);
  arr.forEach((p, i) => {
    sql.push(
      `INSERT OR REPLACE INTO photo_galleries (photo_id,gallery_id,is_cover,sort_order) VALUES (${esc(p.id)},${esc("gal-" + slug)},${i === 0 ? 1 : 0},${p.order});`,
    );
  });
}

// ── Měsíční výběry ────────────────────────────────────────────────────────────
const monthFiles = mdFiles(join(C, "monthly"));
for (const f of monthFiles) {
  const { data, body } = parse(readFileSync(f, "utf8"));
  const img = imageFor(f, data.cover);
  if (!img || !data.month) continue;
  const rel = f.slice(ROOT.length + 1);
  const id = idOf(rel);
  const key = `photos/${id}.jpg`;
  const { w, h } = await dims(img);
  sql.push(
    `INSERT OR REPLACE INTO photos (id,r2_key,caption,body_text,alt,month,show_exif,exif_json,width,height,sort_order,created_at) VALUES (${esc(id)},${esc(key)},${esc(data.caption ?? "")},${esc(body || null)},${esc(data.coverAlt ?? null)},${esc(data.month)},0,NULL,${w ?? "NULL"},${h ?? "NULL"},${data.order ?? 0},${NOW});`,
  );
  put(key, img);
  nImg++;
}

// ── Tipy ──────────────────────────────────────────────────────────────────────
const tipFiles = mdFiles(join(C, "tips"));
tipFiles.forEach((f, i) => {
  const { data, body } = parse(readFileSync(f, "utf8"));
  const rel = f.slice(ROOT.length + 1);
  const id = idOf(rel);
  let key = null;
  const img = imageFor(f, data.image);
  if (img) {
    key = `tips/${id}.jpg`;
    put(key, img);
    nImg++;
  }
  sql.push(
    `INSERT OR REPLACE INTO tips (id,title,body_text,r2_key,link,sort_order,active,created_at) VALUES (${esc(id)},${esc(data.title ?? "")},${esc(body || null)},${esc(key)},${esc(data.link ?? null)},${data.order ?? i},${data.active === false ? 0 : 1},${NOW});`,
  );
});

// ── Blog / články ─────────────────────────────────────────────────────────────
const blogFiles = mdFiles(join(C, "blog"));
blogFiles.forEach((f, i) => {
  const { data, body } = parse(readFileSync(f, "utf8"));
  const slug = basename(f, ".md");
  const id = idOf(f.slice(ROOT.length + 1));
  const pub = data.pubDate
    ? Math.floor(new Date(data.pubDate).getTime() / 1000)
    : NOW;
  const tags = Array.isArray(data.tags) ? JSON.stringify(data.tags) : null;
  sql.push(
    `INSERT OR REPLACE INTO articles (id,slug,title,description,pub_date,author,r2_key,body,tags,category,sort_order,created_at) VALUES (${esc(id)},${esc(slug)},${esc(data.title ?? "")},${esc(data.description ?? "")},${pub},${esc(data.author ?? "")},NULL,${esc(body || "")},${esc(tags)},${esc(data.category ?? null)},${i},${NOW});`,
  );
});

// ── Texty webu (seed = současné hodnoty, aby se vizuál nezměnil) ───────────────
const texts = {
  site_name: "Petr Svoreň",
  site_description:
    "Fotografie Petra Svoreně, klidná, černobílá i barevná prezentace.",
  hero_tagline: "Každodennosti",
  tips_heading: "Aktuálně",
  mesic_heading: "Výběr měsíce",
  mesic_text: "Galerie sestavené po měsících. Vyber měsíc a prohlédni si výběr.",
  blog_heading: "Blog",
  contact_heading: "Kontakt",
  contact_text:
    "Máte zájem o fotografii, výstavu nebo se jen chcete na něco zeptat? Napište mi e-mail nebo zprávu na Facebooku.",
  contact_email: "petr@example.com",
  facebook_url: "https://www.facebook.com/",
};
for (const [k, v] of Object.entries(texts)) {
  sql.push(
    `INSERT OR REPLACE INTO site_texts (key,value) VALUES (${esc(k)},${esc(v)});`,
  );
}

writeFileSync("/tmp/pv-import.sql", sql.join("\n") + "\n");
writeFileSync("/tmp/pv-r2.sh", r2.join("\n") + "\n");
console.log(
  `Hotovo: ${sql.length} SQL příkazů, ${nImg} obrázků k uploadu.\n` +
    `  /tmp/pv-import.sql\n  /tmp/pv-r2.sh`,
);
