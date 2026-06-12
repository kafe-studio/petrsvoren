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
