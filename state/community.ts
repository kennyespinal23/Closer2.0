import { useEffect, useSyncExternalStore } from "react";
import { COMMUNITY_PREVIEW, type CommunityPreviewState } from "@/constants/communityPreview";
import { loadJSON, saveJSON, STORAGE_KEYS } from "@/lib/storage";

/**
 * The community preview (prayer notes, who you prayed for, reading groups) as one shared store, so Community (the prayer
 * wall) and You (your groups) read and write the same thing without overwriting each other. Stored where it always
 * was, under STORAGE_KEYS.communityPreview; this device only.
 */
let state: CommunityPreviewState = COMMUNITY_PREVIEW;
let hydrated = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

function hydrate() {
  if (hydrated) return Promise.resolve();
  loading ??= loadJSON<CommunityPreviewState>(STORAGE_KEYS.communityPreview).then(loaded => {
    if (loaded && Array.isArray(loaded.notes) && Array.isArray(loaded.groups) && Array.isArray(loaded.prayed)) state = loaded;
    hydrated = true;
    emit();
  });
  return loading;
}

export function updateCommunity(f: (s: CommunityPreviewState) => CommunityPreviewState) {
  state = f(state);
  emit();
  if (hydrated) void saveJSON(STORAGE_KEYS.communityPreview, state);
}

export function useCommunity() {
  const s = useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => state);
  useEffect(() => { void hydrate(); }, []);
  return { state: s, hydrated, update: updateCommunity };
}
