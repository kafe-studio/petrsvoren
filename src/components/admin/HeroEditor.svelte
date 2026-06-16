<script lang="ts">
  import { toast } from "../../lib/admin-toast";

  interface HeroSettings {
    imageUrl: string;
    opacity: number;
    position: string;
    fit: "cover" | "contain";
    grayscale: number;
    sepia: number;
    brightness: number;
    contrast: number;
    saturate: number;
    hue: number;
  }
  interface PhotoOpt {
    id: string;
    caption: string;
  }
  let {
    settings,
    photos = [],
    endpoint = "/api/sprava/hero/",
    variant = "hero",
  }: {
    settings: HeroSettings;
    photos?: PhotoOpt[];
    endpoint?: string;
    variant?: "hero" | "bg";
  } = $props();

  let imageUrl = $state(settings.imageUrl);
  let opacity = $state(settings.opacity);
  let position = $state(settings.position);
  let fit = $state<"cover" | "contain">(settings.fit);
  let grayscale = $state(settings.grayscale);
  let sepia = $state(settings.sepia);
  let brightness = $state(settings.brightness);
  let contrast = $state(settings.contrast);
  let saturate = $state(settings.saturate);
  let hue = $state(settings.hue);

  let saving = $state(false);
  let uploading = $state(false);
  let showPicker = $state(false);

  const filter = $derived(
    `grayscale(${grayscale}%) sepia(${sepia}%) brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hue}deg)`,
  );
  const imgStyle = $derived(
    `background-image:url('${imageUrl}');background-size:${fit};background-position:${position};background-repeat:no-repeat;opacity:${opacity / 100};filter:${filter}`,
  );

  const positions = [
    ["center", "Střed"],
    ["top", "Nahoře"],
    ["bottom", "Dole"],
    ["left", "Vlevo"],
    ["right", "Vpravo"],
    ["top left", "Vlevo nahoře"],
    ["top right", "Vpravo nahoře"],
    ["bottom left", "Vlevo dole"],
    ["bottom right", "Vpravo dole"],
  ];

  function pick(id: string) {
    imageUrl = `/img/${id}/`;
    showPicker = false;
  }

  async function upload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    uploading = true;
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/sprava/upload/", { method: "POST", body: fd });
      const j = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !j.id) throw new Error(j.error || "Upload selhal.");
      imageUrl = `/img/${j.id}/`;
      toast("Fotka nahrána.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Chyba.", "error");
    } finally {
      uploading = false;
      input.value = "";
    }
  }

  function reset() {
    opacity = variant === "bg" ? 10 : 100;
    position = "center";
    fit = "cover";
    grayscale = 0;
    sepia = 0;
    brightness = 100;
    contrast = 100;
    saturate = 100;
    hue = 0;
  }

  async function save() {
    saving = true;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          opacity,
          position,
          fit,
          grayscale,
          sepia,
          brightness,
          contrast,
          saturate,
          hue,
        }),
      });
      if (!res.ok) throw new Error("Uložení selhalo.");
      toast("Pozadí uloženo.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Chyba.", "error");
    } finally {
      saving = false;
    }
  }
</script>

<div class="space-y-6">
  <!-- Živý náhled -->
  {#if variant === "bg"}
    <div class="relative aspect-[16/7] w-full overflow-hidden rounded-lg bg-black">
      <div class="absolute inset-0" style={imgStyle}></div>
      <div class="relative p-5">
        <p class="text-lg font-bold text-white">Ukázka stránky</p>
        <p class="mt-1 text-sm text-white/60">
          Takhle prosvítá podkladová fotka za obsahem webu (na černém pozadí).
        </p>
        <div class="mt-3 space-y-1.5">
          <div class="h-2 w-3/4 rounded bg-white/20"></div>
          <div class="h-2 w-2/3 rounded bg-white/20"></div>
          <div class="h-2 w-1/2 rounded bg-white/20"></div>
        </div>
      </div>
    </div>
  {:else}
    <div class="relative aspect-[16/7] w-full overflow-hidden rounded-lg bg-neutral-900">
      <div class="absolute inset-0" style={imgStyle}></div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
      <div class="absolute bottom-0 p-5">
        <p class="text-2xl font-extrabold text-white">Petr Svoreň</p>
        <p class="text-white/80">Každodennosti</p>
      </div>
    </div>
  {/if}

  <!-- Výběr fotky -->
  <div class="flex flex-wrap items-center gap-2">
    <button type="button" class="btn-primary" onclick={() => (showPicker = !showPicker)}>
      Vybrat z galerie
    </button>
    <label class="cursor-pointer rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-muted">
      {uploading ? "Nahrávám…" : "Nahrát novou"}
      <input type="file" accept="image/*" class="hidden" onchange={upload} disabled={uploading} />
    </label>
    <span class="truncate text-xs text-muted-foreground">{imageUrl}</span>
  </div>

  {#if showPicker}
    <div class="max-h-56 overflow-y-auto rounded-lg border border-border bg-card p-3">
      {#if photos.length === 0}
        <p class="text-sm text-muted-foreground">Žádné fotky v galerii.</p>
      {:else}
        <div class="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {#each photos as p (p.id)}
            <button type="button" class="aspect-square overflow-hidden rounded-md bg-neutral-900" title={p.caption} onclick={() => pick(p.id)}>
              <img src={`/img/${p.id}/`} alt={p.caption} loading="lazy" class="h-full w-full object-cover" />
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Ovladače -->
  <div class="grid gap-x-8 gap-y-4 sm:grid-cols-2">
    <label class="block">
      <span class="mb-1 flex justify-between text-sm font-medium"><span>Průhlednost</span><span class="text-muted-foreground">{opacity}%</span></span>
      <input type="range" min="0" max="100" bind:value={opacity} class="w-full" />
    </label>
    <label class="block">
      <span class="mb-1 block text-sm font-medium">Zarovnání</span>
      <select bind:value={position} class="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
        {#each positions as [val, label] (val)}
          <option value={val}>{label}</option>
        {/each}
      </select>
    </label>
    <div class="block">
      <span class="mb-1 block text-sm font-medium">Přizpůsobení velikosti</span>
      <div class="flex gap-4 text-sm">
        <label class="flex items-center gap-2"><input type="radio" value="cover" bind:group={fit} /> Vyplnit (cover)</label>
        <label class="flex items-center gap-2"><input type="radio" value="contain" bind:group={fit} /> Vejít (contain)</label>
      </div>
    </div>
    <label class="block">
      <span class="mb-1 flex justify-between text-sm font-medium"><span>Černobíle (tonalita)</span><span class="text-muted-foreground">{grayscale}%</span></span>
      <input type="range" min="0" max="100" bind:value={grayscale} class="w-full" />
    </label>
    <label class="block">
      <span class="mb-1 flex justify-between text-sm font-medium"><span>Sépie</span><span class="text-muted-foreground">{sepia}%</span></span>
      <input type="range" min="0" max="100" bind:value={sepia} class="w-full" />
    </label>
    <label class="block">
      <span class="mb-1 flex justify-between text-sm font-medium"><span>Jas</span><span class="text-muted-foreground">{brightness}%</span></span>
      <input type="range" min="0" max="200" bind:value={brightness} class="w-full" />
    </label>
    <label class="block">
      <span class="mb-1 flex justify-between text-sm font-medium"><span>Kontrast</span><span class="text-muted-foreground">{contrast}%</span></span>
      <input type="range" min="0" max="200" bind:value={contrast} class="w-full" />
    </label>
    <label class="block">
      <span class="mb-1 flex justify-between text-sm font-medium"><span>Sytost barev</span><span class="text-muted-foreground">{saturate}%</span></span>
      <input type="range" min="0" max="200" bind:value={saturate} class="w-full" />
    </label>
    <label class="block">
      <span class="mb-1 flex justify-between text-sm font-medium"><span>Odstín (hue)</span><span class="text-muted-foreground">{hue}°</span></span>
      <input type="range" min="0" max="360" bind:value={hue} class="w-full" />
    </label>
  </div>

  <div class="flex items-center gap-3">
    <button type="button" class="btn-primary" onclick={save} disabled={saving}>
      {saving ? "Ukládám…" : "Uložit pozadí"}
    </button>
    <button type="button" class="text-sm text-muted-foreground hover:underline" onclick={reset}>
      Vrátit filtry na výchozí
    </button>
  </div>
</div>
