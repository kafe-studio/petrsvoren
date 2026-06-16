<script lang="ts">
  import "prosekit/basic/style.css";
  import "prosekit/basic/typography.css";
  import { defineBasicExtension } from "prosekit/basic";
  import { createEditor, type Editor } from "prosekit/core";
  import { ProseKit } from "prosekit/svelte";

  // value = počáteční HTML; editor se propíše ven přes bind:editor, ať z něj
  // rodič na uložení přečte getDocHTML().
  interface Props {
    value?: string;
    editor?: Editor;
  }
  let { value = "", editor = $bindable() }: Props = $props();

  const extension = defineBasicExtension();
  editor = createEditor({ extension, defaultContent: value || "<p></p>" });

  // mousedown + preventDefault → tlačítko nepřebere fokus a nezruší výběr v textu.
  function run(fn: () => void) {
    return (e: MouseEvent) => {
      e.preventDefault();
      fn();
    };
  }
  const c = () => editor!.commands;
</script>

<div class="rk-wrap">
  <ProseKit {editor}>
    <div class="rk-toolbar">
      <button type="button" title="Tučně" onmousedown={run(() => c().toggleBold())}><b>B</b></button>
      <button type="button" title="Kurzíva" onmousedown={run(() => c().toggleItalic())}><i>I</i></button>
      <span class="rk-sep"></span>
      <button type="button" title="Nadpis 2" onmousedown={run(() => c().toggleHeading({ level: 2 }))}>H2</button>
      <button type="button" title="Nadpis 3" onmousedown={run(() => c().toggleHeading({ level: 3 }))}>H3</button>
      <span class="rk-sep"></span>
      <button type="button" title="Odrážky" onmousedown={run(() => c().toggleList({ kind: "bullet" }))}>•&nbsp;Seznam</button>
      <button type="button" title="Číslovaný" onmousedown={run(() => c().toggleList({ kind: "ordered" }))}>1.&nbsp;Seznam</button>
      <button type="button" title="Citace" onmousedown={run(() => c().toggleBlockquote())}>&rdquo;</button>
      <span class="rk-sep"></span>
      <button
        type="button"
        title="Odkaz"
        onmousedown={(e) => {
          e.preventDefault();
          const href = prompt("Adresa odkazu (URL):");
          if (href) c().toggleLink({ href });
        }}>Odkaz</button>
    </div>
    <div {@attach editor.mount} class="rk-content"></div>
  </ProseKit>
</div>

<style>
  .rk-wrap {
    border: 1px solid var(--border, #e5e5e5);
    border-radius: 0.5rem;
    overflow: hidden;
    background: var(--card, #fff);
  }
  .rk-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem;
    padding: 0.4rem 0.5rem;
    border-bottom: 1px solid var(--border, #e5e5e5);
    background: color-mix(in srgb, var(--card, #fff) 70%, transparent);
  }
  .rk-toolbar button {
    font-size: 0.8rem;
    line-height: 1;
    padding: 0.35rem 0.55rem;
    border-radius: 0.375rem;
    color: var(--foreground, #111);
    transition: background-color 0.15s ease;
  }
  .rk-toolbar button:hover {
    background: var(--muted, #f0f0f0);
  }
  .rk-sep {
    width: 1px;
    height: 1.1rem;
    background: var(--border, #e5e5e5);
    margin: 0 0.2rem;
  }
  .rk-content {
    min-height: 16rem;
    max-height: 60vh;
    overflow-y: auto;
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
  }
  .rk-content :global(.ProseMirror) {
    outline: none;
    min-height: 14rem;
  }
  .rk-content :global(.ProseMirror:focus) {
    outline: none;
  }
</style>
