import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Datový model administrace. D1 = SQLite. Originály fotek v R2 (r2Key), metadata zde.
// ID = text + crypto.randomUUID(); časy = integer timestamp.

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date());

// Galerie (sekce). Fotka může patřit do více galerií (přes photo_galleries).
export const galleries = sqliteTable("galleries", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

// Fotky. Originál v R2 (r2Key); width/height/exif se doplní při uploadu.
export const photos = sqliteTable("photos", {
  id: id(),
  r2Key: text("r2_key").notNull(),
  caption: text("caption").notNull().default(""),
  bodyText: text("body_text"), // delší text na rozklik
  alt: text("alt"),
  month: text("month"), // "RRRR-MM" pro výběr měsíce (volitelné)
  showExif: integer("show_exif", { mode: "boolean" }).notNull().default(false),
  exifJson: text("exif_json"), // serializovaná EXIF data
  width: integer("width"),
  height: integer("height"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

// Zařazení fotky do galerie (M:N). isCover = hlavní fotka dané galerie.
export const photoGalleries = sqliteTable(
  "photo_galleries",
  {
    photoId: text("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    galleryId: text("gallery_id")
      .notNull()
      .references(() => galleries.id, { onDelete: "cascade" }),
    isCover: integer("is_cover", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.photoId, t.galleryId] })],
);

// Editovatelné texty webu (hero, popisky sekcí, …) — klíč → hodnota.
export const siteTexts = sqliteTable("site_texts", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

// ── Relations (pro db.query.* relational API) ─────────────────────────────────
export const galleriesRelations = relations(galleries, ({ many }) => ({
  photos: many(photoGalleries),
}));
export const photosRelations = relations(photos, ({ many }) => ({
  galleries: many(photoGalleries),
}));
export const photoGalleriesRelations = relations(photoGalleries, ({ one }) => ({
  photo: one(photos, {
    fields: [photoGalleries.photoId],
    references: [photos.id],
  }),
  gallery: one(galleries, {
    fields: [photoGalleries.galleryId],
    references: [galleries.id],
  }),
}));
