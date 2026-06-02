# Project rules

## MCP docs — mandatory

NEVER write framework code from memory. Before writing ANY code that uses Effect TS, Svelte 5, Astro 6, daisyUI 5, or Cloudflare Workers APIs, you MUST search MCP docs first:

- `mcp__worker-mcp__ask_docs` — preferred: AI-powered answer with citations (~300 tokens vs ~5000 for search). Use for "how do I…" questions.
- `mcp__worker-mcp__search_docs` — raw doc search. Use `max_results=3` and `snippet_length=200` to save tokens. Full output only when you need raw content.
- `mcp__cloudflare-api__search` — Cloudflare OpenAPI spec
- `mcp__cloudflare-api__execute` — Cloudflare API access

MCP search strategy (pick the cheapest that works):

1. `ask_docs` (~300 tokens) — "how does X work?" → AI answer with code + citations
2. `search_docs(max_results=3, snippet_length=200)` (~500 tokens) — verify a pattern exists, see headings
3. `search_docs(max_results=1)` (~500 tokens) — confirm exact API/syntax
4. `get_doc_page` — only when you need full page content

## Tech stack

- **Astro 6** with `@astrojs/cloudflare` adapter (Workers, not Pages)
- **Svelte 5** — runes only ($state, $derived, $effect, $props). No Svelte 4 patterns.
- **Effect TS** — generators, TaggedError, Context.Tag, Layers. No async/await, no throw.
- **Cloudflare Workers** — D1, R2, KV, Vectorize, Workers AI
- **daisyUI 5** + Tailwind CSS 4
- **Bindings** via `import { env } from 'cloudflare:workers'`, not `Astro.locals.runtime`

## Forbidden patterns

- `as any`, `@ts-ignore`, `@ts-nocheck`
- `throw` in Effect code — use `Data.TaggedError`
- `async/await` in Effect code — use `Effect.gen` + `yield*`
- `export let` in Svelte — use `$props()`
- `on:click` in Svelte — use `onclick`
- `$:` reactive declarations — use `$derived`
- `createEventDispatcher` — use callback props
- `Astro.locals.runtime` — use `cloudflare:workers`
- Content collections without `loader`

## Workflow

- Use `/work` for structured sprint work (plan → execute → review → handoff)
- Use `/review` before every commit
- Use `/checkmcp` to audit MCP coverage or search docs quickly
- Use `/handoff` to document sprint and prepare next one
- Use `/tests` to generate tests via test-writer agent
- Commit only after /review passes with no PROBLEMs
- Never add Co-Authored-By or AI signatures to commits

## Communication

- Czech with the user
- English in code, commit messages, file names

## Commands

| Command | What it does | Co to dělá |
|---------|-------------|------------|
| `/start` | Bootstrap new project from kostra template | Nový projekt z šablony kostra |
| `/init` | Create PROJECT.md, register in dashboard, first sprint | Inicializace projektu a dashboardu |
| `/work` | Structured sprint — plan, execute, review, handoff | Strukturovaný sprint s review a handoffem |
| `/review` | Deep self-review before commit — reads full files, traces logic | Self-review před commitem, čtení celých souborů |
| `/audit` | Pre-PR audit — all changes since diverging from main | Hluboký audit před PR/push |
| `/full-audit` | Sequential file-by-file audit of entire codebase | Kompletní audit celého projektu |
| `/lint` | Run all checks — typecheck, astro check, svelte-check, eslint, tests | Všechny code quality checky najednou |
| `/fix` | Fetch open bugs from dashboard and fix them | Stažení a oprava bugů z dashboardu |
| `/deploy` | Commit, push, verify GitHub → CF Workers deploy | Commit, push, ověření deploye |
| `/checkmcp` | Audit MCP usage or search docs (`/checkmcp effect Layer`) | Audit MCP použití nebo rychlé hledání v docs |
| `/handoff` | Document finished sprint, create next sprint | Dokumentace sprintu + vytvoření dalšího |
| `/tests` | Generate tests for changed or specified files | Generování testů pro změněné soubory |
| `/status` | Quick project status — bugs, sprint, phase | Rychlý přehled stavu projektu |

