import { vitePreprocess } from "@astrojs/svelte";

// Potřebné pro IDE autocompletion (Astro v2+) a preprocessing Svelte 5 souborů.
export default {
  preprocess: vitePreprocess(),
};
