// Čtení veřejného obsahu z D1 (nahrazuje content collections). Stránky, které
// to používají, musí být prerender=false (SSR), protože D1 je dostupné až za běhu.
import { eq, and, asc, desc, isNotNull } from "drizzle-orm";
import { getDb, schema } from "../db";

// Fotka pro mřížku/lightbox. URL originálu = /img/<id>/.
export interface GridPhoto {
  id: string;
  caption: string;
  alt: string | null;
  bodyText: string | null;
  width: number | null;
  height: number | null;
}

const photoCols = {
  id: schema.photos.id,
  caption: schema.photos.caption,
  alt: schema.photos.alt,
  bodyText: schema.photos.bodyText,
  width: schema.photos.width,
  height: schema.photos.height,
};

// ── Sekce (galerie) ───────────────────────────────────────────────────────────
export interface GalleryInfo {
  slug: string;
  title: string;
  description: string | null;
}

export async function getGallery(slug: string): Promise<GalleryInfo | null> {
  const db = await getDb();
  const row = await db
    .select({
      slug: schema.galleries.slug,
      title: schema.galleries.title,
      description: schema.galleries.description,
    })
    .from(schema.galleries)
    .where(eq(schema.galleries.slug, slug))
    .get();
  return row ?? null;
}

export async function getSectionPhotos(slug: string): Promise<GridPhoto[]> {
  const db = await getDb();
  const rows = await db
    .select(photoCols)
    .from(schema.photoGalleries)
    .innerJoin(schema.photos, eq(schema.photoGalleries.photoId, schema.photos.id))
    .innerJoin(
      schema.galleries,
      eq(schema.photoGalleries.galleryId, schema.galleries.id),
    )
    .where(
      and(eq(schema.galleries.slug, slug), eq(schema.photos.hidden, false)),
    )
    .orderBy(asc(schema.photoGalleries.sortOrder));
  return rows;
}

// Cover fotka každé galerie (isCover) → mapa slug → {id, alt}.
export async function getSectionCovers(): Promise<
  Map<string, { id: string; alt: string }>
> {
  const db = await getDb();
  const rows = await db
    .select({
      slug: schema.galleries.slug,
      id: schema.photos.id,
      alt: schema.photos.alt,
      caption: schema.photos.caption,
    })
    .from(schema.photoGalleries)
    .innerJoin(
      schema.galleries,
      eq(schema.photoGalleries.galleryId, schema.galleries.id),
    )
    .innerJoin(schema.photos, eq(schema.photoGalleries.photoId, schema.photos.id))
    .where(
      and(eq(schema.photoGalleries.isCover, true), eq(schema.photos.hidden, false)),
    );
  const m = new Map<string, { id: string; alt: string }>();
  for (const r of rows) m.set(r.slug, { id: r.id, alt: r.alt ?? r.caption });
  return m;
}

// ── Měsíční výběry ────────────────────────────────────────────────────────────
export interface MonthAlbum {
  month: string;
  coverId: string | null;
  count: number;
}

export async function getAlbumMonths(): Promise<MonthAlbum[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: schema.photos.id,
      month: schema.photos.month,
      sortOrder: schema.photos.sortOrder,
    })
    .from(schema.photos)
    .where(and(isNotNull(schema.photos.month), eq(schema.photos.hidden, false)))
    .orderBy(asc(schema.photos.month), asc(schema.photos.sortOrder));
  const map = new Map<string, { coverId: string; count: number }>();
  for (const r of rows) {
    if (!r.month) continue;
    const cur = map.get(r.month);
    if (!cur) map.set(r.month, { coverId: r.id, count: 1 });
    else cur.count++;
  }
  return [...map.entries()].map(([month, v]) => ({
    month,
    coverId: v.coverId,
    count: v.count,
  }));
}

export async function getMonthPhotos(month: string): Promise<GridPhoto[]> {
  const db = await getDb();
  const rows = await db
    .select(photoCols)
    .from(schema.photos)
    .where(and(eq(schema.photos.month, month), eq(schema.photos.hidden, false)))
    .orderBy(asc(schema.photos.sortOrder));
  return rows;
}

// ── Tipy / aktuality ──────────────────────────────────────────────────────────
export interface TipItem {
  id: string;
  title: string;
  bodyText: string | null;
  imageId: string | null; // /img/<id>/ pokud má obrázek
  link: string | null;
}

export async function getTips(): Promise<TipItem[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.tips)
    .where(eq(schema.tips.active, true))
    .orderBy(asc(schema.tips.sortOrder));
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    bodyText: t.bodyText,
    imageId: t.r2Key ? t.id : null,
    link: t.link,
  }));
}

// ── Blog / články ─────────────────────────────────────────────────────────────
export interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  pubDate: Date | null;
  author: string;
  imageId: string | null;
  body: string;
  tags: string[];
  category: string | null;
}

function toArticle(r: typeof schema.articles.$inferSelect): ArticleItem {
  let tags: string[] = [];
  if (r.tags) {
    try {
      const p = JSON.parse(r.tags);
      if (Array.isArray(p)) tags = p.map(String);
    } catch {
      /* ignoruj nevalidní JSON */
    }
  }
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    pubDate: r.pubDate ?? null,
    author: r.author,
    imageId: r.r2Key ? r.id : null,
    body: r.body,
    tags,
    category: r.category,
  };
}

export async function getArticles(): Promise<ArticleItem[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.articles)
    .orderBy(desc(schema.articles.pubDate));
  return rows.map(toArticle);
}

export async function getArticleBySlug(slug: string): Promise<ArticleItem | null> {
  const db = await getDb();
  const row = await db
    .select()
    .from(schema.articles)
    .where(eq(schema.articles.slug, slug))
    .get();
  return row ? toArticle(row) : null;
}

// ── Pozadí (hero) hlavní stránky ──────────────────────────────────────────────
export interface HeroSettings {
  imageUrl: string;
  opacity: number; // 0..100
  position: string; // background-position
  fit: "cover" | "contain";
  grayscale: number; // 0..100
  sepia: number; // 0..100
  brightness: number; // 0..200 (%)
  contrast: number; // 0..200
  saturate: number; // 0..200
  hue: number; // 0..360 (deg)
}

export const HERO_DEFAULTS: HeroSettings = {
  imageUrl: "/hero.jpg",
  opacity: 100,
  position: "center",
  fit: "cover",
  grayscale: 0,
  sepia: 0,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hue: 0,
};

export async function getHeroSettings(): Promise<HeroSettings> {
  try {
    const texts = await getTexts();
    const raw = texts["hero_settings"];
    if (!raw) return HERO_DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<HeroSettings>;
    return { ...HERO_DEFAULTS, ...parsed };
  } catch {
    return HERO_DEFAULTS;
  }
}

// CSS filtr z nastavení tonality a barev.
export function heroFilter(s: HeroSettings): string {
  return [
    `grayscale(${s.grayscale}%)`,
    `sepia(${s.sepia}%)`,
    `brightness(${s.brightness}%)`,
    `contrast(${s.contrast}%)`,
    `saturate(${s.saturate}%)`,
    `hue-rotate(${s.hue}deg)`,
  ].join(" ");
}

// ── Texty webu ────────────────────────────────────────────────────────────────
export async function getTexts(): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.select().from(schema.siteTexts);
  const m: Record<string, string> = {};
  for (const r of rows) m[r.key] = r.value;
  return m;
}

export function txt(
  map: Record<string, string>,
  key: string,
  fallback = "",
): string {
  const v = map[key];
  return v !== undefined && v !== "" ? v : fallback;
}
