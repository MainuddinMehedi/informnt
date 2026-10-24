export function getStartDate(timeRange: string): Date {
  let startDate = new Date(0);

  if (timeRange === "24h") {
    startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  } else if (timeRange === "7d") {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeRange === "30d") {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  return startDate;
}

export function calculateDistribution(
  counts: Record<string, number>,
  totalItems: number,
): Array<{ label: string; count: number; percentage: number }> {
  return Object.entries(counts)
    .map(([label, count]) => ({
      label,
      count,
      percentage: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}
