import { useEffect, useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BIBLE_MOMENTS, type MomentCategory } from "@/constants/bibleMoments";

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
  return (await unlockBibleMomentWithRewards(id)).status;
}

/** Rewards are returned only by the write that completes a category, never by hydration. */
export async function unlockBibleMomentWithRewards(id: string): Promise<{ status: "new" | "existing"; categories: MomentCategory[] }> {
  await hydrateBibleMoments();
  if (!snapshot.hydrated) throw new Error("Could not load collection");
  if (!BIBLE_MOMENTS.some(moment => moment.id === id)) throw new Error("Unknown moment");
  if (snapshot.ids.includes(id)) return { status: "existing", categories: [] };
  await AsyncStorage.setItem(key(id), "true");
  // Recheck after the write, so concurrent opens only celebrate once.
  if (snapshot.ids.includes(id)) return { status: "existing", categories: [] };
  const moment = BIBLE_MOMENTS.find(item => item.id === id)!;
  const categories = moment.tags.filter(category => BIBLE_MOMENTS
    .filter(item => item.tags.includes(category))
    .every(item => item.id === id || snapshot.ids.includes(item.id)));
  snapshot = { ids: [...snapshot.ids, id], hydrated: true, error: null };
  emit();
  return { status: "new", categories };
}
export function useBibleMomentCollection() {
  const state = useSyncExternalStore(callback => { listeners.add(callback); return () => { listeners.delete(callback); }; }, () => snapshot);
  useEffect(() => { void hydrateBibleMoments(); }, []);
  return state;
}
