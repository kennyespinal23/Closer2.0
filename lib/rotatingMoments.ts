export {
  getRandomMoment,
  getTimeCategory,
  interpolateName,
  rotatingMoments,
} from "@/assets/data/rotatingMoments.js";

export type {
  RotatingMoment,
  RotatingMomentCategory,
  RotatingMomentEntry,
} from "@/assets/data/rotatingMoments";

/**
 * Split a moment line into body copy and an optional scripture
 * reference (e.g. "…need. — Psalm 23:1" → body + "Psalm 23:1").
 */
export function splitMomentText(text: string): {
  body: string;
  reference: string | null;
} {
  const match = text.match(/^(.*?)\s+[—–-]\s+(.+)$/);
  if (!match) {
    return { body: text.trim(), reference: null };
  }
  return {
    body: match[1]!.trim(),
    reference: match[2]!.trim(),
  };
}

/** Local-calendar date string for moment-window bookkeeping. */
export function todayDateString(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
