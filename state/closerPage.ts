import { useEffect, useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Verse } from "@/lib/closer-page/lesson/types";

/* What the Closer lessons keep, on this device only: which lessons you finished, the verses you saved, the private
   notes you chose to keep, and two comfort settings. Nothing here is sent anywhere. */

export type CloserNote = { ref: string; text: string; at: string };
export type CloserSettings = { largeText: boolean; reduceMotion: boolean; reminder: boolean; sound: boolean };
/** days you finished something: "2026-11-14" -> lesson ids, in order */
export type CloserDays = Record<string, string[]>;
type State = { finished: string[]; days: CloserDays; verses: Verse[]; notes: CloserNote[]; settings: CloserSettings; hydrated: boolean };

export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Days in a row with something finished, counting back from today (or from yesterday, if today isn't done yet). */
/** The longest run of days in a row, ever. */
export function bestStreakOf(days: CloserDays) {
  const keys = Object.keys(days).filter(k => days[k].length).sort();
  let best = 0, run = 0, prev: Date | null = null;
  for (const k of keys) {
    const [y, m, d] = k.split("-").map(Number), date = new Date(y, m - 1, d);
    run = prev && Math.round((date.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run); prev = date;
  }
  return best;
}

export function streakOf(days: CloserDays, now = new Date()) {
  const d = new Date(now);
  if (!days[dayKey(d)]?.length) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days[dayKey(d)]?.length) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

const KEY = "closer.page.v1";
const listeners = new Set<() => void>();
let snap: State = { finished: [], days: {}, verses: [], notes: [], settings: { largeText: false, reduceMotion: false, reminder: true, sound: true }, hydrated: false };
let loading: Promise<void> | null = null;

const emit = () => listeners.forEach(l => l());
function set(next: Partial<State>) {
  snap = { ...snap, ...next };
  emit();
  const { hydrated: _h, ...keep } = snap;
  AsyncStorage.setItem(KEY, JSON.stringify(keep)).catch(() => { /* kept in memory for this session */ });
}

export function hydrateCloserPage() {
  if (snap.hydrated) return Promise.resolve();
  if (loading) return loading;
  loading = AsyncStorage.getItem(KEY).then(raw => {
    const saved = raw ? (JSON.parse(raw) as Partial<State>) : {};
    snap = { ...snap, ...saved, days: saved.days ?? {}, settings: { ...snap.settings, ...saved.settings }, hydrated: true };
    emit();
  }).catch(() => { snap = { ...snap, hydrated: true }; emit(); }).finally(() => { loading = null; });
  return loading;
}

export const closerPage = {
  finish(id: string) {
    const k = dayKey(new Date()), today = snap.days[k] ?? [];
    set({
      finished: snap.finished.includes(id) ? snap.finished : [...snap.finished, id],
      days: today.includes(id) ? snap.days : { ...snap.days, [k]: [...today, id] },
    });
  },
  saveVerse(v: Verse, on: boolean) {
    const rest = snap.verses.filter(x => x.ref !== v.ref);
    set({ verses: on ? [v, ...rest] : rest });
  },
  keepNote(n: CloserNote) { set({ notes: [n, ...snap.notes] }); },
  forgetNote(at: string) { set({ notes: snap.notes.filter(n => n.at !== at) }); },
  settings(s: Partial<CloserSettings>) { set({ settings: { ...snap.settings, ...s } }); },
  /** Delete everything the lessons kept on this device */
  clear() { set({ finished: [], days: {}, verses: [], notes: [] }); },
};

/** The settings right now, for code outside React (sounds) */
export const closerSettings = () => snap.settings;

export function useCloserPage() {
  const state = useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => snap);
  useEffect(() => { void hydrateCloserPage(); }, []);
  return state;
}
