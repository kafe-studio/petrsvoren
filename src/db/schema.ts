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

// Tipy / aktuality na homepage ("Aktuálně"). Obrázek volitelně v R2 (r2Key).
export const tips = sqliteTable("tips", {
  id: id(),
  title: text("title").notNull().default(""),
  bodyText: text("body_text"), // text upoutávky
  r2Key: text("r2_key"), // obrázek v R2 (volitelný)
  link: text("link"), // kam tip odkazuje (volitelné)
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

// Blog / články. Titulní obrázek volitelně v R2 (r2Key). body = markdown.
export const articles = sqliteTable("articles", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  pubDate: integer("pub_date", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  author: text("author").notNull().default(""),
  r2Key: text("r2_key"), // titulní obrázek (volitelný)
  body: text("body").notNull().default(""), // markdown
  tags: text("tags"), // JSON pole tagů
  category: text("category"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

// Administrátoři — přihlášení jménem + heslem (PBKDF2 hash + salt).
export const adminUsers = sqliteTable("admin_users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  email: text("email"), // pro obnovu hesla
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Tokeny pro obnovu hesla (jednorázové, s expirací).
export const passwordResets = sqliteTable("password_resets", {
  token: text("token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

// Odběratelé newsletteru. unsubscribeToken = odhlašovací odkaz v e-mailu.
export const subscribers = sqliteTable("subscribers", {
  id: id(),
  email: text("email").notNull().unique(),
  unsubscribeToken: text("unsubscribe_token").notNull(),
  createdAt: createdAt(),
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
