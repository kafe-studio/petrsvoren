// Měsíční výběr — pomocné funkce nad kolekcí `monthly`.
// month je řetězec "RRRR-MM"; odsud se odvozuje český popisek, URL a řazení na ose.

const MONTH_NAMES_CS = [
  "Leden",
  "Únor",
  "Březen",
  "Duben",
  "Květen",
  "Červen",
  "Červenec",
  "Srpen",
  "Září",
  "Říjen",
  "Listopad",
  "Prosinec",
] as const;

// Třípísmenné zkratky pro popisky na časové ose.
const MONTH_SHORT_CS = [
  "Led",
  "Úno",
  "Bře",
  "Dub",
  "Kvě",
  "Čvn",
  "Čvc",
  "Srp",
  "Zář",
  "Říj",
  "Lis",
  "Pro",
] as const;

/** "2026-04" → "Duben 2026". Neplatný vstup vrátí beze změny. */
export function monthLabel(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  const year = match[1];
  const idx = Number(match[2]) - 1;
  const name = MONTH_NAMES_CS[idx];
  return name ? `${name} ${year}` : month;
}

/** Měsíce seřazené sestupně (nejnovější první) — pořadí na časové ose. */
export function sortMonthsDesc(months: string[]): string[] {
  return [...new Set(months)].sort((a, b) => b.localeCompare(a));
}

/** "2026-06" → pořadové číslo měsíce (rok*12 + index) pro polohu na ose a řazení. NaN při neplatném vstupu. */
export function monthOrdinal(month: string): number {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return Number.NaN;
  return Number(match[1]) * 12 + (Number(match[2]) - 1);
}

/** "2026-06" → "Čvn" (zkratka pro popisek osy). Neplatný vstup vrátí beze změny. */
export function monthShort(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  return MONTH_SHORT_CS[Number(match[2]) - 1] ?? month;
}

/** Aktuální měsíc "RRRR-MM" podle data buildu (osa „do nekonečna" roste s časem). */
export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Souvislý seznam měsíců "RRRR-MM" od start do end (včetně), vzestupně. Prázdný při neplatném vstupu nebo end < start. */
export function monthsRange(start: string, end: string): string[] {
  const s = monthOrdinal(start);
  const e = monthOrdinal(end);
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return [];
  const out: string[] = [];
  for (let o = s; o <= e; o++) {
    out.push(`${Math.floor(o / 12)}-${String((o % 12) + 1).padStart(2, "0")}`);
  }
  return out;
}
