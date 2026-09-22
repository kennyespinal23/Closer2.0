import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ExpressProgress = { index: number; completed: boolean };
export function normalizeExpressProgress(value: unknown, count: number): ExpressProgress {
  if (!value || typeof value !== "object") return { index: 0, completed: false };
  const stored = value as Partial<ExpressProgress>;
  const index = Number.isInteger(stored.index) ? Math.min(count, Math.max(0, stored.index!)) : 0;
  return { index, completed: stored.completed === true || index === count };
}

// Deliberately independent of chapter-read flags, streaks, and Moment unlocks.
export function useExpressProgress(bookId: string, count: number) {
  const key = `closer.express.${bookId}.v1`;
  const [progress, setProgress] = useState<ExpressProgress>({ index: 0, completed: false });
  const current = useRef(progress);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    setReady(false);
    AsyncStorage.getItem(key).then(raw => {
      if (!active) return;
      let parsed: unknown = null;
      try { parsed = raw ? JSON.parse(raw) : null; } catch { /* Invalid old save starts at scene one. */ }
      current.current = normalizeExpressProgress(parsed, count);
      setProgress(current.current);
      setError(null);
      setReady(true);
    }).catch(() => { if (active) setError("Couldn't load your saved place. Please try again."); });
    return () => { active = false; };
  }, [key, count, attempt]);
  const persist = useCallback((next: ExpressProgress) => {
    writes.current = writes.current.then(() => AsyncStorage.setItem(key, JSON.stringify(next))).then(() => setError(null)).catch(() => setError("Your place couldn't be saved. Tap to try again."));
  }, [key]);
  const goTo = useCallback((index: number) => {
    if (!ready) return;
    const next = normalizeExpressProgress({ index, completed: current.current.completed || index === count }, count);
    current.current = next;
    setProgress(next);
    persist(next);
  }, [ready, count, persist]);
  return { ...progress, ready, error, goTo, retry: () => ready ? persist(current.current) : setAttempt(value => value + 1) };
}
