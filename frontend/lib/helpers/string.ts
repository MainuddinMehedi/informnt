/**
 * Normalizes multi-line whitespace and truncates string to a max character count.
 */
export function compactText(
  value: string | undefined,
  maxLength: number,
): string {
  if (!value) return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3)}...`
    : normalized;
}
