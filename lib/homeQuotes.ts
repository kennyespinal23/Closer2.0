/**
 * Home quote catalog — three deterministic picks per calendar day
 * (morning / evening / night), stable within each slot until the
 * next day's rotation.
 */

import HOME_QUOTES_FILE from "@/assets/data/home_quotes.json";
import type { HomeQuote } from "@/assets/data/home_quotes";

export type { HomeQuote, HomeQuoteFont, HomeQuoteSegment } from "@/assets/data/home_quotes";

export type HomeQuoteSlot = "morning" | "evening" | "night";

const QUOTES = (HOME_QUOTES_FILE.quotes ?? []) as ReadonlyArray<HomeQuote>;

/** Local calendar key `YYYY-M-D` (no leading zeros — hash only). */
export function localDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * Time-of-day slot for the home quote.
 *   morning  05:00–11:59
 *   evening  12:00–17:59
 *   night    18:00–04:59
 */
export function homeQuoteSlotForHour(hour: number): HomeQuoteSlot {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "evening";
  return "night";
}

export function currentHomeQuoteSlot(now: Date = new Date()): HomeQuoteSlot {
  return homeQuoteSlotForHour(now.getHours());
}

/** FNV-1a 32-bit — stable across JS engines for the same string. */
function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — deterministic shuffle seed from a u32. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Three unique quotes for a calendar day (morning / evening / night).
 * Seeded by the date so the trio is fixed until local midnight.
 */
export function quotesForDay(date: Date = new Date()): {
  morning: HomeQuote | null;
  evening: HomeQuote | null;
  night: HomeQuote | null;
} {
  const key = localDateKey(date);
  const pool = QUOTES;
  if (!pool.length) {
    return { morning: null, evening: null, night: null };
  }

  const order = pool.map((_, i) => i);
  const rand = mulberry32(hashString(key));
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = order[i]!;
    order[i] = order[j]!;
    order[j] = tmp;
  }

  return {
    morning: pool[order[0]!] ?? null,
    evening: pool[order[1 % order.length]!] ?? null,
    night: pool[order[2 % order.length]!] ?? null,
  };
}

/**
 * Deterministic quote for a calendar day + slot. Uses the day's
 * unique trio so morning / evening / night never collide.
 */
export function quoteForDaySlot(
  dateKey: string,
  slot: HomeQuoteSlot,
  _pool?: ReadonlyArray<HomeQuote>,
): HomeQuote | null {
  // Rebuild from dateKey so callers can pass an arbitrary day.
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
  const trio = quotesForDay(date);
  return trio[slot];
}

/** Today's quote for the current (or given) time-of-day slot. */
export function quoteForNow(now: Date = new Date()): HomeQuote | null {
  return quoteForDaySlot(localDateKey(now), currentHomeQuoteSlot(now));
}

export function allHomeQuotes(): ReadonlyArray<HomeQuote> {
  return QUOTES;
}

// ─── Dev preview override ─────────────────────────────────────
// In-memory only — lets QA step through the catalog without waiting
// on the morning/evening/night rotation. Cleared on cold start.

let previewIndex: number | null = null;
const previewListeners = new Set<() => void>();

function notifyPreviewListeners() {
  for (const listener of previewListeners) listener();
}

export function subscribeHomeQuotePreview(listener: () => void): () => void {
  previewListeners.add(listener);
  return () => {
    previewListeners.delete(listener);
  };
}

export function getHomeQuotePreviewIndex(): number | null {
  return previewIndex;
}

export function isHomeQuotePreviewActive(): boolean {
  return previewIndex !== null;
}

/** Advance to the next catalog quote (wraps). Starts at 0 if idle. */
export function advanceHomeQuotePreview(): HomeQuote | null {
  if (!QUOTES.length) return null;
  previewIndex =
    previewIndex === null ? 0 : (previewIndex + 1) % QUOTES.length;
  notifyPreviewListeners();
  return QUOTES[previewIndex] ?? null;
}

/** Jump back to the natural time-of-day rotation. */
export function clearHomeQuotePreview(): void {
  if (previewIndex === null) return;
  previewIndex = null;
  notifyPreviewListeners();
}

/**
 * Home should call this instead of `quoteForNow` so a live preview
 * override (from Developer Tools) wins when active.
 */
export function resolveHomeQuote(now: Date = new Date()): HomeQuote | null {
  if (previewIndex !== null) {
    return QUOTES[previewIndex] ?? null;
  }
  return quoteForNow(now);
}
