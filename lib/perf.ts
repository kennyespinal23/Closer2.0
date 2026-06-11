import { useEffect, useRef } from "react";

/**
 * useRenderCount — dev-only helper for logging how many times a
 * component re-renders. Useful when auditing a perf regression
 * ("am I memoizing the right thing?") without reaching for the
 * React DevTools profiler.
 *
 * No-ops in production (`__DEV__` short-circuit) so it's safe to
 * leave sprinkled around the codebase during an investigation.
 *
 * Usage:
 *   function MyCard(props) {
 *     useRenderCount("MyCard");
 *     // …
 *   }
 *
 * Console output looks like:
 *   [render] MyCard #4
 *
 * The optional `threshold` arg lets you only log AFTER a render
 * count is exceeded — handy for filtering out the normal first-mount
 * passes and surfacing only the suspicious "this component is
 * thrashing" cases.
 *
 *   useRenderCount("RhythmCell", { threshold: 5 });
 *   // → silent for renders 1–5, logs starting at render 6.
 *
 * NOT for production telemetry — use Performance Monitor / Flipper
 * for those. This is strictly an in-flight debugging helper.
 */
export function useRenderCount(
  label: string,
  opts: { threshold?: number } = {},
): number {
  const count = useRef(0);
  count.current += 1;

  useEffect(() => {
    if (!__DEV__) return;
    const { threshold = 0 } = opts;
    if (count.current <= threshold) return;
    // eslint-disable-next-line no-console
    console.log(`[render] ${label} #${count.current}`);
  });

  return count.current;
}

/**
 * useWhyDidYouRender — logs which specific prop or state value
 * changed between renders. Drop into a suspect component and
 * pass the props/state you want to track:
 *
 *   useWhyDidYouRender("SermonCard", { onPress, title, completed });
 *
 * On every render after the first, it prints any tracked value
 * whose reference changed since last time. Great for catching
 * the unmemoized-callback-passed-into-React.memo trap.
 *
 * No-ops in production.
 */
export function useWhyDidYouRender(
  label: string,
  trackedValues: Record<string, unknown>,
): void {
  const previous = useRef<Record<string, unknown>>(trackedValues);

  useEffect(() => {
    if (!__DEV__) return;
    const prev = previous.current;
    const changedKeys: string[] = [];
    for (const key of Object.keys(trackedValues)) {
      if (!Object.is(prev[key], trackedValues[key])) {
        changedKeys.push(key);
      }
    }
    if (changedKeys.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`[why-render] ${label} ←`, changedKeys.join(", "));
    }
    previous.current = trackedValues;
  });
}
