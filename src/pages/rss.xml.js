import rss from "@astrojs/rss";
import { siteConfig } from "../config/site";
import { getArticles } from "../lib/content";

// Články z D1 → SSR (D1 je dostupné až za běhu).
export const prerender = false;

export async function GET(context) {
  const posts = await getArticles();

  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: context.site,
    items: posts.map((post) => ({
      title: post.title,
      pubDate: post.pubDate ?? undefined,
      description: post.description,
      link: `/blog/${post.slug}/`,
      content: post.body,
      customData: post.author ? `<author>${post.author}</author>` : undefined,
    })),
    customData: `<language>${siteConfig.lang}</language>`,
  });
}
