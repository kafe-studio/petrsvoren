// Sekce galerie. Slug = část URL (/street/), title = popisek v navigaci.
// Přidání/přejmenování sekce = jeden řádek tady. Pořadí určuje pořadí v menu.
export const sections = [
  { slug: "street", title: "Street" },
  { slug: "lide", title: "Lidé" },
  { slug: "samota", title: "Samota" },
  { slug: "krajina", title: "Krajina" },
  { slug: "cesty", title: "Cesty" },
] as const;

export type SectionSlug = (typeof sections)[number]["slug"];

// Neprázdná tuple slugů pro runtime validaci (z.enum) ve schématu fotek.
export const sectionSlugs = sections.map((s) => s.slug) as [
  SectionSlug,
  ...SectionSlug[],
];

// Odkazy v hlavní navigaci a v patičce, odvozené ze sekcí + Výběr měsíce + Články + Kontakt.
export const navLinks = [
  ...sections.map((s) => ({ text: s.title, href: `/${s.slug}/` })),
  { text: "Výběr měsíce", href: "/mesic/" },
  { text: "Články", href: "/blog/" },
  { text: "Kontakt", href: "/kontakt/" },
];

export const siteConfig = {
  name: "Petr Svoreň",
  description: "Fotografie Petra Svoreně, klidná, černobílá i barevná prezentace.",
  url: "https://petrsvoren.com/",
  lang: "cs",
  locale: "cs_CZ",
  author: "Petr Svoreň",
  ogImage: "/og-image.png",
  email: "petr@example.com",
  socialLinks: {
    facebook: "https://www.facebook.com/",
  },
  sections,
};
