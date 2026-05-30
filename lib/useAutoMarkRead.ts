import { useEffect, useRef, useState } from "react";

/**
 * Auto-marks a chapter as "read" based on natural reading behavior.
 *
 * Two signals have to be satisfied before we count the chapter:
 *   • Dwell time   — the user has been on the screen at least
 *                    `minDwellMs` (default 30s)
 *   • Scroll depth — the user has scrolled at least `minScrollPct`
 *                    of the content (default 70%)
 *
 * Both signals must be true at the SAME moment, but they can be
 * satisfied in either order. A user can sit on a long chapter for
 * 90s without scrolling and we still won't fire — they have to
 * actually move through it. A power-user who flicks straight to the
 * bottom in 5s won't fire either; we still want some real time
 * spent.
 *
 * On a very short chapter (e.g. a Psalm that fits on one screen),
 * the user may never need to scroll at all. We treat that as
 * "scrolled to the end" — if `contentHeight <= layoutHeight`, the
 * scroll-depth signal is satisfied automatically.
 *
 * Fires `onRead` exactly once per mount. Caller can also read
 * `triggered` from the return value to react in the UI (e.g. swap
 * "Mark as read" → "Marked as read" with a soft animation).
 *
 * The hook deliberately doesn't depend on any provider; the caller
 * owns "what does it mean to record a read" and just hands us a
 * callback. That keeps this composable for sermon reads,
 * devotional reads, or any future surface that wants the same
 * "natural progression" feel.
 */
export type AutoMarkReadOptions = {
  /** Minimum total time on screen (ms) before we count. Default 30s. */
  minDwellMs?: number;
  /** Minimum scroll depth (0–1) the user must reach. Default 0.7. */
  minScrollPct?: number;
  /**
   * Whether we should be tracking at all. Pass `false` once the
   * chapter is already marked read so we don't churn timers.
   */
  enabled?: boolean;
  /** Called once when both signals are satisfied. */
  onRead: () => void;
};

export type AutoMarkReadHandle = {
  /**
   * Hook this into the ScrollView's `onScroll` prop. We pull the
   * three numbers we need out of the native event.
   */
  onScroll: (event: {
    nativeEvent: {
      contentOffset: { y: number };
      contentSize: { height: number };
      layoutMeasurement: { height: number };
    };
  }) => void;
  /** True once both signals have fired and onRead has been called. */
  triggered: boolean;
  /** Live scroll progress 0–1 — useful for a progress bar / time-left UI. */
  scrollProgress: number;
};

const DEFAULTS = {
  minDwellMs: 30_000,
  minScrollPct: 0.7,
};

export function useAutoMarkRead({
  minDwellMs = DEFAULTS.minDwellMs,
  minScrollPct = DEFAULTS.minScrollPct,
  enabled = true,
  onRead,
}: AutoMarkReadOptions): AutoMarkReadHandle {
  // ── State exposed to consumers ───────────────────────────────────
  const [triggered, setTriggered] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // ── Mutable internals (no re-render needed when these change) ───
  const dwellReachedRef = useRef(false);
  const scrolledFarEnoughRef = useRef(false);
  // Latest onRead — held in a ref so the dwell timer effect doesn't
  // need to re-arm every time the caller passes a new closure.
  const onReadRef = useRef(onRead);
  onReadRef.current = onRead;

  // Try-fire — called whenever either signal flips on. If both are
  // satisfied AND we haven't fired yet, calls onRead and latches.
  const maybeFire = () => {
    if (!enabled) return;
    if (
      dwellReachedRef.current &&
      scrolledFarEnoughRef.current &&
      !triggered
    ) {
      setTriggered(true);
      // Schedule onto microtask so the state flip lands first; this
      // makes parent re-renders smoother if onRead also calls
      // setState.
      queueMicrotask(() => onReadRef.current());
    }
  };

  // Dwell timer — runs once per enabled mount. If the user navigates
  // away before it fires the cleanup clears the timeout.
  useEffect(() => {
    if (!enabled || triggered) return;
    const t = setTimeout(() => {
      dwellReachedRef.current = true;
      maybeFire();
    }, minDwellMs);
    return () => clearTimeout(t);
    // We intentionally don't depend on `triggered` here — once it
    // flips true the cleanup tears the timer down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, minDwellMs]);

  const onScroll: AutoMarkReadHandle["onScroll"] = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } =
      event.nativeEvent;

    const scrollable = contentSize.height - layoutMeasurement.height;
    // For content that fits on screen, treat scroll progress as 1 —
    // the user can't scroll because they don't need to.
    const pct =
      scrollable <= 0
        ? 1
        : Math.min(1, Math.max(0, contentOffset.y / scrollable));

    setScrollProgress(pct);

    if (!scrolledFarEnoughRef.current && pct >= minScrollPct) {
      scrolledFarEnoughRef.current = true;
      maybeFire();
    }
  };

  return { onScroll, triggered, scrollProgress };
}
