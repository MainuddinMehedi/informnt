import { METADATA_COLORS } from "@/utils/colors";

/**
 * Maps a numeric sentiment score (-1 to 1) to a human-readable label and UI color.
 */
export function getSentimentDisplayProps(score: number | null | undefined): {
  label: string;
  color: string;
} {
  if (score == null) {
    return { label: "No data", color: METADATA_COLORS.sentiment.neutral };
  }
  if (score > 0.2) {
    return { label: "Positive", color: METADATA_COLORS.sentiment.positive };
  }
  if (score < -0.2) {
    return { label: "Negative", color: METADATA_COLORS.sentiment.negative };
  }

  return { label: "Neutral", color: METADATA_COLORS.sentiment.neutral };
}
