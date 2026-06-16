<script lang="ts">
  import type { Editor } from "prosekit/core";
  import RichEditor from "./RichEditor.svelte";
  import { toast } from "../../lib/admin-toast";

  let { confirmedCount = 0 }: { confirmedCount?: number } = $props();

  let subject = $state("");
  let bodyEditor = $state<Editor | undefined>();
  let sending = $state(false);
  let status = $state("");

  async function send() {
    if (!bodyEditor) return;
    const html = bodyEditor.getDocHTML();
    if (!subject.trim()) {
      toast("Vyplň předmět.", "error");
      return;
    }
    if (!html || html === "<p></p>") {
      toast("Napiš text e-mailu.", "error");
      return;
    }
    if (
      !confirm(
        `Opravdu rozeslat newsletter ${confirmedCount} potvrzeným odběratelům?`,
      )
    )
      return;
    sending = true;
    status = "Odesílám…";
    try {
      const res = await fetch("/api/sprava/newsletter/send/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body: html }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        sent?: number;
        failed?: number;
        firstError?: string;
      };
      if (!res.ok) throw new Error(j.error || "Odeslání selhalo.");
      status = `Odesláno ${j.sent}, chyb ${j.failed}.`;
      if (j.failed && j.firstError) toast(j.firstError, "error");
      else toast("Newsletter rozeslán.", "success");
    } catch (err) {
      status = "";
      toast(err instanceof Error ? err.message : "Chyba.", "error");
    } finally {
      sending = false;
    }
  }
</script>

<div class="space-y-4">
  <div>
    <label class="block text-sm font-medium mb-1">Předmět</label>
    <input
      bind:value={subject}
      type="text"
      class="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
      required
    />
  </div>
  <div>
    <label class="block text-sm font-medium mb-1">Text e-mailu</label>
    <RichEditor bind:editor={bodyEditor} />
  </div>
  <div class="flex items-center gap-3">
    <button
      type="button"
      class="btn-primary"
      onclick={send}
      disabled={sending || confirmedCount === 0}
    >
      {sending ? "Odesílám…" : "Rozeslat potvrzeným"}
    </button>
    <span class="text-sm text-muted-foreground">{status}</span>
  </div>
  <p class="text-xs text-muted-foreground">
    Odešle se {confirmedCount} potvrzeným odběratelům. Tip: přidej se jako
    odběratel a vyzkoušej odeslání na sebe.
  </p>
</div>
