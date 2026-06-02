import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { sectionSlugs } from "./config/site";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
  }),
});

// Fotky. Jedna fotka = jeden .md v src/content/photos/<sekce>/ s co-located obrázkem.
// caption = krátký popisek pod fotkou, tělo markdownu = volitelný dlouhý text na rozklik.
const photos = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/photos" }),
  schema: ({ image }) =>
    z.object({
      section: z.enum(sectionSlugs),
      caption: z.string(),
      cover: image(),
      coverAlt: z.string().optional(),
      order: z.number().default(0),
    }),
});

export const collections = { blog, photos };
