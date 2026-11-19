// The report types in the order they appear under a batch, each with the
// name as printed on the report. Same wording and order as the store's
// coaTypeLabel, so staff and customers read the same names.
const order = [
  ["mass_purity", "Mass Purity"],
  ["lcms", "LC-MS"],
  ["endotoxin", "Endotoxin"],
  ["sterility", "Sterility"],
  ["benzyl_alcohol_content", "Benzyl Alcohol Content"],
] as const;

const labels = new Map<string, string>(order);
const ranks = new Map<string, number>(order.map(([key], i) => [key, i]));

// A report with no type set falls back to its title so it still has a name.
export function reportTypeLabel(
  testType: string | null,
  title: string,
): string {
  return (testType && labels.get(testType)) || title;
}

// The tests each kind of report carries, by the name the catalogue gives
// them. Endotoxin is on file twice, per vial and per mL; both are offered
// and the one the lab used is filled in.
const tests: Record<string, string[]> = {
  mass_purity: ["Purity", "Mass"],
  lcms: ["LCMS"],
  endotoxin: ["Endotoxin"],
  sterility: ["TAMC", "TYMC"],
};

// The tests to ask for on a report of this type. A type with no list here
// (or no type at all) gets every test, so nothing is impossible to enter.
export function assaysFor<T extends { name: string }>(
  testType: string | null,
  assays: T[],
): T[] {
  const names = testType ? tests[testType] : undefined;
  if (!names) return assays;
  const picked = assays.filter((a) => names.includes(a.name));
  return picked.length ? picked : assays;
}

// Untyped reports sort after every known type.
export function reportTypeRank(testType: string | null): number {
  if (!testType) return order.length;
  return ranks.get(testType) ?? order.length;
}
