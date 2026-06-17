import type { APIRoute } from "astro";
import { jsonError, jsonOk, parseJsonBody } from "../../../../lib/admin-helpers";
import { restoreSnapshot } from "../../../../lib/snapshots";

export const prerender = false;

// Návrat obsahu na vybranou verzi z historie.
export const POST: APIRoute = async ({ request }) => {
  const body = await parseJsonBody<{ id?: unknown }>(request);
  const id = body && typeof body.id === "string" ? body.id : "";
  if (!id) return jsonError("Chybí id verze.");
  const ok = await restoreSnapshot(id);
  if (!ok) return jsonError("Verze nenalezena.", 404);
  return jsonOk();
};
