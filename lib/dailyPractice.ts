import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { todayISO } from '@/state/progress';
export type Practice = 'prayer' | 'quiz' | 'action';
export type DailyPractice = Partial<Record<Practice, boolean>> & { quizScore?: number };
export const DAILY_STEPS = ['prayer', 'reading', 'quiz', 'action'] as const;
export type DailyStep = typeof DAILY_STEPS[number];
const listeners = new Set<() => void>();
const cache = new Map<string, DailyPractice>();
const loads = new Map<string, Promise<DailyPractice>>();
async function load(key: string, cardId: string) {
  if (cache.has(key)) return cache.get(key)!;
  if (loads.has(key)) return loads.get(key)!;
  const request = (async () => {
    let raw = await AsyncStorage.getItem(key);
    const legacyKey = `closer.daily-practice.${cardId}.v1`;
    if (raw === null && !(await AsyncStorage.getItem(`${legacyKey}.migrated`))) {
      raw = await AsyncStorage.getItem(legacyKey);
      if (raw) await AsyncStorage.multiSet([[key, raw], [`${legacyKey}.migrated`, key]]);
    }
    const value: DailyPractice = raw ? JSON.parse(raw) : {};
    cache.set(key, value); return value;
  })();
  loads.set(key, request);
  try { return await request; } finally { loads.delete(key); }
}
/** Shared day-scoped state keeps Home and every devotional story in sync. */
export function useDailyPractice(cardId: string) {
  const key = `closer.daily-practice.${cardId}.${todayISO()}.v2`;
  const [, update] = useState(0), [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    const notify = () => { if (live) update(n => n + 1); };
    listeners.add(notify); setError('');
    load(key, cardId).then(notify).catch(() => { if (live) setError('Couldn’t load your practice. Reopen Home to retry.'); });
    return () => { live = false; listeners.delete(notify); };
  }, [key, cardId]);
  const save = async (kind: Practice, score?: number) => {
    const current = await load(key, cardId);
    const next = { ...current, [kind]: true, ...(kind === 'quiz' && score !== undefined ? { quizScore: score } : {}) };
    await AsyncStorage.setItem(key, JSON.stringify(next));
    cache.set(key, next); listeners.forEach(notify => notify());
  };
  return { saved: cache.get(key) ?? {}, ready: cache.has(key), error, save, key };
}
