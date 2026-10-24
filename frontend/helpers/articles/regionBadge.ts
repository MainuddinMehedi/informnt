export function getEventRegionBadgeVariant(
  eventRegion: string | null | undefined,
): "emerald" | "amber" | "blue" | "red" | "purple" | "fuchsia" | "neutral" {
  if (!eventRegion) return "neutral";
  const lower = eventRegion.toLowerCase();

  if (lower.includes("north america")) return "blue";
  if (lower.includes("europe")) return "emerald";
  if (lower.includes("middle east")) return "red";
  if (lower.includes("asia-pacific")) return "amber";
  if (lower.includes("south america")) return "purple";
  if (lower.includes("africa")) return "fuchsia";

  return "neutral";
}
