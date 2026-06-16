import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";
import { marked } from "marked";
const dir = "src/content/blog";
const esc = (s) => s.replace(/'/g, "''");
const out = [];
for (const f of readdirSync(dir).filter((x) => x.endsWith(".md"))) {
  const raw = readFileSync(join(dir, f), "utf8");
  const m = raw.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  const body = (m ? m[1] : raw).trim();
  const html = marked.parse(body, { async: false });
  const slug = basename(f, ".md");
  out.push(`UPDATE articles SET body='${esc(html)}' WHERE slug='${esc(slug)}';`);
}
writeFileSync("/tmp/blog-html.sql", out.join("\n") + "\n");
console.log(`${out.length} článků převedeno`);
