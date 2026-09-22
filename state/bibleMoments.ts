import { useEffect, useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BIBLE_MOMENTS } from "@/constants/bibleMoments";

const key = (id: string) => `closer.bible-moment.${id}.v1`;
const listeners = new Set<() => void>();
let snapshot: { ids: readonly string[]; hydrated: boolean; error: string | null } = { ids: [], hydrated: false, error: null };
let pending: Promise<void> | null = null;
const emit = () => listeners.forEach(listener => listener());
export function hydrateBibleMoments() {
  if (snapshot.hydrated) return Promise.resolve();
  if (pending) return pending;
  pending = AsyncStorage.multiGet(BIBLE_MOMENTS.map(moment => key(moment.id))).then(values => {
    const ids = values.flatMap(([storedKey, value]) => value === "true" ? [storedKey.slice("closer.bible-moment.".length, -3)] : []);
    snapshot = { ids: [...new Set([...snapshot.ids, ...ids])], hydrated: true, error: null };
    emit();
  }).catch(() => { snapshot = { ...snapshot, error: "Couldn't load your moments. Tap to retry." }; emit(); })
    .finally(() => { pending = null; });
  return pending;
}
export async function unlockBibleMoment(id: string): Promise<"new" | "existing"> {
  await hydrateBibleMoments();
  if (!snapshot.hydrated) throw new Error("Could not load collection");
  if (!BIBLE_MOMENTS.some(moment => moment.id === id)) throw new Error("Unknown moment");
  if (snapshot.ids.includes(id)) return "existing";
  await AsyncStorage.setItem(key(id), "true");
  // Recheck after the write, so concurrent opens only celebrate once.
  if (snapshot.ids.includes(id)) return "existing";
  snapshot = { ids: [...snapshot.ids, id], hydrated: true, error: null };
  emit();
  return "new";
}
export function useBibleMomentCollection() {
  const state = useSyncExternalStore(callback => { listeners.add(callback); return () => { listeners.delete(callback); }; }, () => snapshot);
  useEffect(() => { void hydrateBibleMoments(); }, []);
  return state;
}
