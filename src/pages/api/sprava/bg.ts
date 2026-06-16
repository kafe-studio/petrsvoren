import type { APIRoute } from "astro";
import { getDb, schema } from "../../../db";
import { jsonError, jsonOk, parseJsonBody } from "../../../lib/admin-helpers";
import { BG_DEFAULTS, type HeroSettings } from "../../../lib/content";

export const prerender = false;

const clamp = (v: unknown, min: number, max: number, def: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};

// Uloží nastavení podkladové fotky všech stránek (bg_settings) jako JSON.
export const POST: APIRoute = async ({ request }) => {
  const body = await parseJsonBody<Partial<HeroSettings>>(request);
  if (!body) return jsonError("Neplatná data.");

  const settings: HeroSettings = {
    imageUrl:
      typeof body.imageUrl === "string" && body.imageUrl.trim()
        ? body.imageUrl.trim()
        : BG_DEFAULTS.imageUrl,
    opacity: clamp(body.opacity, 0, 100, BG_DEFAULTS.opacity),
    position:
      typeof body.position === "string" && body.position.trim()
        ? body.position.trim()
        : BG_DEFAULTS.position,
    fit: body.fit === "contain" ? "contain" : "cover",
    grayscale: clamp(body.grayscale, 0, 100, 0),
    sepia: clamp(body.sepia, 0, 100, 0),
    brightness: clamp(body.brightness, 0, 300, 100),
    contrast: clamp(body.contrast, 0, 300, 100),
    saturate: clamp(body.saturate, 0, 300, 100),
    hue: clamp(body.hue, 0, 360, 0),
  };

  const db = await getDb();
  await db
    .insert(schema.siteTexts)
    .values({ key: "bg_settings", value: JSON.stringify(settings) })
    .onConflictDoUpdate({
      target: schema.siteTexts.key,
      set: { value: JSON.stringify(settings) },
    });
  return jsonOk();
};
