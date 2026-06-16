<script lang="ts">
  import Cropper from "cropperjs";
  import "cropperjs/dist/cropper.css";
  import { onMount, onDestroy } from "svelte";
  import { toast } from "../../lib/admin-toast";

  let { id, bust }: { id: string; bust: number } = $props();
  let imgEl: HTMLImageElement | undefined = $state();
  let cropper: Cropper | undefined;
  let sx = 1;
  let sy = 1;
  let saving = $state(false);
  let activeAspect = $state<string>("free");

  onMount(() => {
    if (!imgEl) return;
    cropper = new Cropper(imgEl, {
      viewMode: 1,
      autoCropArea: 1,
      background: false,
      responsive: true,
    });
  });
  onDestroy(() => cropper?.destroy());

  const rotate = (d: number) => cropper?.rotate(d);
  function flipH() {
    sx = -sx;
    cropper?.scaleX(sx);
  }
  function flipV() {
    sy = -sy;
    cropper?.scaleY(sy);
  }
  function aspect(key: string, ratio: number) {
    activeAspect = key;
    cropper?.setAspectRatio(ratio);
  }
  function reset() {
    sx = 1;
    sy = 1;
    activeAspect = "free";
    cropper?.reset();
    cropper?.setAspectRatio(NaN);
  }

  async function save() {
    if (!cropper) return;
    saving = true;
    try {
      const canvas = cropper.getCroppedCanvas({
        maxWidth: 4000,
        maxHeight: 4000,
        imageSmoothingQuality: "high",
      });
      const blob: Blob | null = await new Promise((res) =>
        canvas.toBlob(res, "image/jpeg", 0.92),
      );
      if (!blob) throw new Error("Export selhal.");
      const fd = new FormData();
      fd.set("image", blob, "edited.jpg");
      fd.set("width", String(canvas.width));
      fd.set("height", String(canvas.height));
      const res = await fetch(`/api/sprava/photos/${id}/replace/`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Uložení selhalo.");
      toast("Fotka upravena.", "success");
      setTimeout(() => location.reload(), 700);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Chyba.", "error");
    } finally {
      saving = false;
    }
  }

  const ratios: [string, string, number][] = [
    ["free", "Volně", NaN],
    ["1", "1:1", 1],
    ["43", "4:3", 4 / 3],
    ["32", "3:2", 3 / 2],
    ["169", "16:9", 16 / 9],
  ];
</script>

<div class="pe">
  <div class="pe-stage">
    <!-- bust = cache-busting parametr, ať editor načte aktuální verzi -->
    <img bind:this={imgEl} src={`/img/${id}/?t=${bust}`} alt="" />
  </div>

  <div class="pe-bar">
    <button type="button" onclick={() => rotate(-90)} title="Otočit vlevo">⟲</button>
    <button type="button" onclick={() => rotate(90)} title="Otočit vpravo">⟳</button>
    <button type="button" onclick={flipH} title="Převrátit vodorovně">⇆</button>
    <button type="button" onclick={flipV} title="Převrátit svisle">⇅</button>
    <span class="pe-sep"></span>
    {#each ratios as [key, label, r] (key)}
      <button
        type="button"
        class:active={activeAspect === key}
        onclick={() => aspect(key, r)}>{label}</button
      >
    {/each}
    <span class="pe-sep"></span>
    <button type="button" onclick={reset}>Vrátit</button>
    <button type="button" class="pe-save" onclick={save} disabled={saving}>
      {saving ? "Ukládám…" : "Uložit úpravy"}
    </button>
  </div>
</div>

<style>
  .pe-stage {
    max-height: 60vh;
    background: #111;
    border-radius: 0.5rem;
    overflow: hidden;
  }
  /* Cropper potřebuje blokový obrázek s omezenou výškou. */
  .pe-stage :global(img) {
    display: block;
    max-width: 100%;
    max-height: 60vh;
  }
  .pe-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.75rem;
  }
  .pe-bar button {
    font-size: 0.85rem;
    line-height: 1;
    padding: 0.45rem 0.7rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border, #e5e5e5);
    background: var(--card, #fff);
    color: var(--foreground, #111);
    transition: background-color 0.15s ease;
  }
  .pe-bar button:hover {
    background: var(--muted, #f0f0f0);
  }
  .pe-bar button.active {
    border-color: var(--primary, #111);
    color: var(--primary, #111);
  }
  .pe-sep {
    width: 1px;
    height: 1.2rem;
    background: var(--border, #e5e5e5);
    margin: 0 0.15rem;
  }
  .pe-save {
    margin-left: auto;
    background: var(--primary, #111) !important;
    color: #fff !important;
    border-color: var(--primary, #111) !important;
  }
  .pe-save:disabled {
    opacity: 0.6;
  }
</style>
