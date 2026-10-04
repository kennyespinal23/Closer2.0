/** Only Phase 1 is adopted from the working copy. Video time owns the text clock. */
export const OPENING_PIVOT_TIME = 15.6;
export const OPENING_BEATS = [
  { text: 'If you’ve ever felt far from God,\nyou’re not alone.', start: .7, inEnd: 1.3, outStart: 5.7, end: 6.2 },
  { text: 'There are so many things\nfighting for your attention in today’s world.', start: 6.5, inEnd: 7.2, outStart: 9.7, end: 10.2 },
  { text: 'Before you know it,\nyou stop making time for God.', start: 10.6, inEnd: 11.1, outStart: 13.4, end: 14 },
  { text: 'Let’s change that.', start: 15.9, inEnd: 16.9, outStart: Infinity, end: Infinity },
] as const;
export function openingBeatAt(time: number) {
  const index = OPENING_BEATS.findIndex(beat => time >= beat.start && time < beat.end);
  if (index < 0) return { index: -1, opacity: 0 };
  const beat = OPENING_BEATS[index];
  return { index, opacity: Math.max(0, Math.min(1, (time - beat.start) / (beat.inEnd - beat.start), (beat.end - time) / (beat.end - beat.outStart) || 1)) };
}
