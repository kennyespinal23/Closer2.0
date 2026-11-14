import { useEffect, useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Verse } from "@/lib/closer-page/lesson/types";

/* What the Closer lessons keep, on this device only: which lessons you finished, the verses you saved, the private
   notes you chose to keep, and two comfort settings. Nothing here is sent anywhere. */

export type CloserNote = { ref: string; text: string; at: string };
export type CloserSettings = { largeText: boolean; reduceMotion: boolean; reminder: boolean };
type State = { finished: string[]; verses: Verse[]; notes: CloserNote[]; settings: CloserSettings; hydrated: boolean };

const KEY = "closer.page.v1";
const listeners = new Set<() => void>();
let snap: State = { finished: [], verses: [], notes: [], settings: { largeText: false, reduceMotion: false, reminder: true }, hydrated: false };
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
    snap = { ...snap, ...saved, settings: { ...snap.settings, ...saved.settings }, hydrated: true };
    emit();
  }).catch(() => { snap = { ...snap, hydrated: true }; emit(); }).finally(() => { loading = null; });
  return loading;
}

export const closerPage = {
  finish(id: string) { if (!snap.finished.includes(id)) set({ finished: [...snap.finished, id] }); },
  saveVerse(v: Verse, on: boolean) {
    const rest = snap.verses.filter(x => x.ref !== v.ref);
    set({ verses: on ? [v, ...rest] : rest });
  },
  keepNote(n: CloserNote) { set({ notes: [n, ...snap.notes] }); },
  forgetNote(at: string) { set({ notes: snap.notes.filter(n => n.at !== at) }); },
  settings(s: Partial<CloserSettings>) { set({ settings: { ...snap.settings, ...s } }); },
  /** Delete everything the lessons kept on this device */
  clear() { set({ finished: [], verses: [], notes: [] }); },
};

export function useCloserPage() {
  const state = useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => snap);
  useEffect(() => { void hydrateCloserPage(); }, []);
  return state;
}
