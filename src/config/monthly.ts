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
