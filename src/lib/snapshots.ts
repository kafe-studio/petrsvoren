// Historie změn obsahu webu — snapshoty vybraných tabulek (raw D1, ať se hodnoty
// uloží a obnoví věrně bez konverzí). Drží se posledních MAX snapshotů.
// env se načítá dynamicky (kvůli node-prerenderu), stejně jako v db vrstvě.
async function d1() {
  const { env } = await import("cloudflare:workers");
  return env.DB;
}

// Tabulky s obsahem webu (pořadí = bezpečné pro vkládání kvůli FK).
const TABLES = [
  "galleries",
  "photos",
  "photo_galleries",
  "tips",
  "articles",
  "site_texts",
] as const;
// Mazání v opačném pořadí (nejdřív závislé).
const DELETE_ORDER = [
  "photo_galleries",
  "photos",
  "galleries",
  "tips",
  "articles",
  "site_texts",
] as const;

export const MAX_SNAPSHOTS = 10;

// Uloží aktuální stav obsahu jako jeden snapshot a ořeže staré.
export async function takeSnapshot(label: string): Promise<void> {
  const db = await d1();
  const data: Record<string, unknown[]> = {};
  for (const t of TABLES) {
    const r = await db.prepare(`SELECT * FROM ${t}`).all();
    data[t] = r.results ?? [];
  }
  const id = crypto.randomUUID();
  const createdAt = Math.floor(Date.now() / 1000);
  await db
    .prepare("INSERT INTO snapshots (id, created_at, label, data) VALUES (?, ?, ?, ?)")
    .bind(id, createdAt, label, JSON.stringify(data))
    .run();

  // Ořež na posledních MAX.
  const all = await db
    .prepare("SELECT id FROM snapshots ORDER BY created_at DESC")
    .all();
  const ids = (all.results ?? []) as { id: string }[];
  for (const old of ids.slice(MAX_SNAPSHOTS)) {
    await db.prepare("DELETE FROM snapshots WHERE id = ?").bind(old.id).run();
  }
}

// Obnoví obsah z daného snapshotu (atomicky přes batch).
export async function restoreSnapshot(id: string): Promise<boolean> {
  const db = await d1();
  const row = await db
    .prepare("SELECT data FROM snapshots WHERE id = ?")
    .bind(id)
    .first<{ data: string }>();
  if (!row) return false;

  const data = JSON.parse(row.data) as Record<string, Record<string, unknown>[]>;
  const stmts = [];
  for (const t of DELETE_ORDER) stmts.push(db.prepare(`DELETE FROM ${t}`));
  for (const t of TABLES) {
    for (const r of data[t] ?? []) {
      const cols = Object.keys(r);
      if (cols.length === 0) continue;
      const placeholders = cols.map(() => "?").join(", ");
      stmts.push(
        db
          .prepare(`INSERT INTO ${t} (${cols.join(", ")}) VALUES (${placeholders})`)
          .bind(...cols.map((c) => r[c] as never)),
      );
    }
  }
  await db.batch(stmts);
  return true;
}

export interface SnapshotInfo {
  id: string;
  createdAt: number;
  label: string;
}

export async function listSnapshots(): Promise<SnapshotInfo[]> {
  const db = await d1();
  const r = await db
    .prepare("SELECT id, created_at AS createdAt, label FROM snapshots ORDER BY created_at DESC")
    .all();
  return (r.results ?? []) as unknown as SnapshotInfo[];
}
