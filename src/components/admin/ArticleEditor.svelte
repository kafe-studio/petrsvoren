<script lang="ts">
  import type { Editor } from "prosekit/core";
  import RichEditor from "./RichEditor.svelte";
  import { toast } from "../../lib/admin-toast";

  interface Article {
    id: string;
    title: string;
    slug: string;
    description: string;
    author: string;
    pubDate: string; // YYYY-MM-DD
    category: string;
    tags: string; // čárkou oddělené
    body: string; // HTML
    hasImage: boolean;
  }
  interface PhotoOpt {
    id: string;
    caption: string;
  }
  interface PageOpt {
    label: string;
    href: string;
  }
  let {
    article,
    photos = [],
    pages = [],
  }: { article: Article; photos?: PhotoOpt[]; pages?: PageOpt[] } = $props();

  let showPhotos = $state(false);
  let showPages = $state(false);

  // Vloží fotku z galerie do textu článku (obrázek se servíruje přes /img/<id>/).
  function insertPhoto(pid: string) {
    bodyEditor?.commands.insertImage({ src: `/img/${pid}/` });
    showPhotos = false;
  }

  // Vloží odkaz na stránku webu. Když je vybraný text, označí ho odkazem;
  // jinak vloží popisek stránky jako odkazovaný text.
  function insertPageLink(href: string, label: string) {
    const ed = bodyEditor;
    if (!ed) return;
    const view = ed.view;
    const { state } = view;
    if (state.selection.empty) {
      const from = state.selection.from;
      let tr = state.tr.insertText(label, from);
      const linkMark = state.schema.marks.link?.create({ href });
      if (linkMark) tr = tr.addMark(from, from + label.length, linkMark);
      view.dispatch(tr);
    } else {
      ed.commands.toggleLink({ href });
    }
    view.focus();
    showPages = false;
  }

  let title = $state(article.title);
  let slug = $state(article.slug);
  let pubDate = $state(article.pubDate);
  let description = $state(article.description);
  let author = $state(article.author);
  let category = $state(article.category);
  let tags = $state(article.tags);
  let bodyEditor = $state<Editor | undefined>();
  let imageFiles = $state<FileList | undefined>();
  let saving = $state(false);

  // Náhled článku (jak bude vypadat na webu) před uložením.
  let showPreview = $state(false);
  let previewHtml = $state("");
  let previewImg = $state<string | null>(null);
  function togglePreview() {
    if (!showPreview && bodyEditor) {
      previewHtml = bodyEditor.getDocHTML();
      const f = imageFiles?.[0];
      previewImg = f
        ? URL.createObjectURL(f)
        : article.hasImage
          ? `/img/${article.id}/`
          : null;
    }
    showPreview = !showPreview;
  }
  function fmtDate(d: string): string {
    if (!d) return "";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("cs");
  }

  const inputCls =
    "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none";

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!bodyEditor) return;
    saving = true;
    const fd = new FormData();
    fd.set("title", title);
    fd.set("slug", slug);
    fd.set("pubDate", pubDate);
    fd.set("description", description);
    fd.set("author", author);
    fd.set("category", category);
    fd.set("tags", tags);
    fd.set("body", bodyEditor.getDocHTML());
    if (imageFiles && imageFiles[0]) fd.set("image", imageFiles[0]);
    try {
      const res = await fetch(`/api/sprava/articles/${article.id}/`, {
        method: "PATCH",
        body: fd,
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error || "Uložení selhalo.");
      toast("Článek uložen.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Chyba.", "error");
    } finally {
      saving = false;
    }
  }

  async function del() {
    if (!confirm("Opravdu smazat článek?")) return;
    const res = await fetch(`/api/sprava/articles/${article.id}/`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (res.ok) location.href = "/sprava/articles/";
    else toast("Smazání selhalo.", "error");
  }
</script>

<form onsubmit={save} class="space-y-4">
  {#if showPreview}
    <div class="rounded-lg border border-border bg-card p-5">
      <p class="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Náhled — takto bude článek vypadat
      </p>
      <article class="prose prose-neutral max-w-none">
        <h1>{title || "Bez názvu"}</h1>
        <p class="text-sm text-muted-foreground">
          {fmtDate(pubDate)}{author ? ` · ${author}` : ""}
        </p>
        {#if previewImg}
          <img src={previewImg} alt="" class="rounded-lg" />
        {/if}
        <!-- eslint-disable-next-line -->
        {@html previewHtml}
      </article>
    </div>
  {/if}

  <div>
    <label class="block text-sm font-medium mb-1">Název</label>
    <input bind:value={title} type="text" class={inputCls} required />
  </div>
  <div class="grid grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium mb-1">Slug (URL)</label>
      <input bind:value={slug} type="text" class={inputCls} />
    </div>
    <div>
      <label class="block text-sm font-medium mb-1">Datum</label>
      <input bind:value={pubDate} type="date" class={inputCls} />
    </div>
  </div>
  <div>
    <label class="block text-sm font-medium mb-1">Perex (popis)</label>
    <textarea bind:value={description} rows="2" class={inputCls}></textarea>
  </div>
  <div class="grid grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium mb-1">Autor</label>
      <input bind:value={author} type="text" class={inputCls} />
    </div>
    <div>
      <label class="block text-sm font-medium mb-1">Rubrika</label>
      <input bind:value={category} type="text" class={inputCls} />
    </div>
  </div>
  <div>
    <label class="block text-sm font-medium mb-1">Tagy (oddělené čárkou)</label>
    <input bind:value={tags} type="text" class={inputCls} />
  </div>
  <div>
    <label class="block text-sm font-medium mb-1">Text článku</label>

    <div class="mb-2 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"
        onclick={() => {
          showPhotos = !showPhotos;
          showPages = false;
        }}
      >
        🖼 Vložit fotku z galerie
      </button>
      <button
        type="button"
        class="rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted"
        onclick={() => {
          showPages = !showPages;
          showPhotos = false;
        }}
      >
        🔗 Odkaz na stránku
      </button>
    </div>

    {#if showPhotos}
      <div class="mb-3 max-h-64 overflow-y-auto rounded-lg border border-border bg-card p-3">
        {#if photos.length === 0}
          <p class="text-sm text-muted-foreground">Žádné fotky v galerii.</p>
        {:else}
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {#each photos as p (p.id)}
              <button
                type="button"
                class="group relative aspect-square overflow-hidden rounded-md bg-neutral-900"
                title={p.caption}
                onclick={() => insertPhoto(p.id)}
              >
                <img
                  src={`/img/${p.id}/`}
                  alt={p.caption}
                  loading="lazy"
                  class="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    {#if showPages}
      <div class="mb-3 max-h-64 overflow-y-auto rounded-lg border border-border bg-card p-2">
        <p class="px-2 pb-1 text-xs text-muted-foreground">
          Tip: nejdřív označ text, pak vyber stránku — odkaz se na něj navěsí.
        </p>
        {#each pages as pg (pg.href)}
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
            onclick={() => insertPageLink(pg.href, pg.label)}
          >
            <span>{pg.label}</span>
            <span class="text-xs text-muted-foreground">{pg.href}</span>
          </button>
        {/each}
      </div>
    {/if}

    <RichEditor value={article.body} bind:editor={bodyEditor} />
  </div>
  <div>
    <label class="block text-sm font-medium mb-1">Titulní obrázek</label>
    {#if article.hasImage}
      <img src={`/img/${article.id}/`} alt="" class="mb-2 h-32 rounded-lg object-cover" />
    {/if}
    <input bind:files={imageFiles} type="file" accept="image/*" class={inputCls} />
  </div>
  <div class="flex items-center gap-3 pt-2">
    <button
      type="button"
      class="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
      onclick={togglePreview}
    >
      {showPreview ? "Skrýt náhled" : "Náhled"}
    </button>
    <button type="submit" class="btn-primary" disabled={saving}>
      {saving ? "Ukládám…" : "Uložit článek"}
    </button>
    <a href={`/blog/${article.slug}/`} target="_blank" class="text-sm text-muted-foreground hover:underline">Zobrazit →</a>
    <button type="button" onclick={del} class="ml-auto text-sm text-red-500 hover:underline">Smazat</button>
  </div>
</form>
