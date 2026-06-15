// Sdílené helpery pro admin API routy (/api/admin/*). Odstraňují opakovaný
// boilerplate: JSON odpovědi, parsování těla a slug. Drží routy krátké a
// konzistentní (stejné chybové formáty napříč endpointy).

// Chybová odpověď v jednotném tvaru `{ error }` — admin UI ji čte z `j.error`.
export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

// Úspěšná odpověď — buď předaná data, nebo default `{ ok: true }`.
export function jsonOk(data?: Record<string, unknown>, status = 200): Response {
  return Response.json(data ?? { ok: true }, { status });
}

// Naparsuje JSON tělo requestu; při nevalidním JSONu vrací `null` (routa pak
// vrátí 400 přes `jsonError`). Generikum jen typuje výsledek, neověřuje tvar —
// validaci jednotlivých polí dělá routa.
export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

// URL-safe slug z lidského názvu (bez diakritiky, max 60 znaků).
export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
