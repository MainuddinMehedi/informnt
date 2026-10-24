export function formatTaskName(name: string): string {
  const mapping: Record<string, string> = {
    "rss-ingestion": "RSS Feeds Ingestion",
    "story-clustering": "Story Clustering",
    "locked-topic-scan": "Locked Topic Surveillance",
    "backlog-processing": "Backlog LLM Processing",
  };
  return mapping[name] || name;
}

export function formatMetadata(
  taskName: string,
  metadata: Record<string, unknown> | null | undefined,
): string {
  if (!metadata) return "-";
  try {
    if (taskName === "rss-ingestion") {
      const fetched = metadata.fetchedCount ?? 0;
      const inserted = metadata.insertedCount ?? 0;
      const dupes = metadata.dupeCount ?? 0;
      return `Fetched: ${fetched} | Inserted: ${inserted} | Dupes: ${dupes}`;
    }
    if (taskName === "story-clustering") {
      const groups = metadata.groupsFound ?? 0;
      const archived = metadata.archivedCount ?? 0;
      return `Groups: ${groups} | Archived: ${archived}`;
    }
    if (taskName === "locked-topic-scan") {
      const scanned = metadata.topicsScanned ?? 0;
      const findings = metadata.findingsCount ?? 0;
      return `Scanned: ${scanned} | Findings: ${findings}`;
    }
    if (taskName === "backlog-processing") {
      const processed = metadata.processedCount ?? 0;
      const skipped = metadata.skippedCount ?? 0;
      return `Processed: ${processed} | Skipped: ${skipped}`;
    }
    return JSON.stringify(metadata);
  } catch {
    return JSON.stringify(metadata);
  }
}
