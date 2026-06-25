// Small presentation helpers shared across candidate UI (cards, drawer, review).

/** Two-letter initials from a candidate's name, e.g. "Thomas Davis" -> "TD". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Traffic-light color for a 0-100 score (null = neutral gray). */
export function scoreColor(value: number | null): string {
  if (value == null) return "#9ca3af";
  if (value >= 75) return "#1D9E75";
  if (value >= 50) return "#D9A21B";
  return "#D85A30";
}

/** Profile-clarity color: ≥80 green, 60–79 amber, <60 red. */
export function clarityColor(value: number | null): string {
  if (value == null) return "#9ca3af";
  if (value >= 80) return "#1D9E75";
  if (value >= 60) return "#D9A21B";
  return "#D85A30";
}

/** Fitment 0–100 → an x/5 rating string (0.5 steps), e.g. 90 -> "4.5". */
export function fitStars(value: number | null): string {
  if (value == null) return "—";
  const r = Math.round((value / 20) * 2) / 2;
  return Number.isInteger(r) ? `${r}` : r.toFixed(1);
}
