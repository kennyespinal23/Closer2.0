import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

/**
 * Closer's Live Activities (modules/closer-live-activity, drawn in targets/CloserWidget):
 * night prayer while you pray, and the chapter being read aloud.
 * One per kind. Calls are queued so a fast run of updates never lands out of order.
 */
export type ActivityKind = "night" | "listen";
export type ActivityState = { kicker: string; headline: string; detail: string; progress: number; paused?: boolean; done?: boolean };

type Native = {
  isSupported(): boolean;
  start(kind: string, art: string, tint: string, state: ActivityState): Promise<string | null>;
  update(id: string, state: ActivityState): Promise<void>;
  end(id: string, state: ActivityState | null, dismissAfter: number): Promise<void>;
  endAll(kind: string): Promise<void>;
};
const native = Platform.OS === "ios" ? requireOptionalNativeModule<Native>("CloserLiveActivity") : null;

const current: Partial<Record<ActivityKind, { id: string; key: string }>> = {};
/** Ended with a last state still showing (night prayer's "Rest now."); left alone until it times out. */
const lingering = new Set<ActivityKind>();
let queue: Promise<unknown> = Promise.resolve();
const run = (task: () => Promise<unknown>) => { queue = queue.then(task).catch(() => {}); return queue; };
const full = (s: ActivityState) => ({ paused: false, done: false, ...s, progress: Math.max(0, Math.min(1, s.progress)) });

/** Shows or updates the activity. A different `art` (say, another book) starts a fresh one. */
export function showActivity(kind: ActivityKind, look: { art: string; tint: string }, state: ActivityState) {
  if (!native) return;
  const key = `${look.art}|${look.tint}`;
  run(async () => {
    const live = current[kind];
    if (live && live.key === key) return native.update(live.id, full(state));
    if (!native.isSupported()) return;
    lingering.delete(kind);
    const id = await native.start(kind, look.art, look.tint, full(state));
    if (id) current[kind] = { id, key }; else delete current[kind];
  });
}

/** Ends it now, or shows a last state for a while first. */
export function endActivity(kind: ActivityKind, last?: ActivityState, dismissAfterSeconds = 0) {
  if (!native) return;
  run(async () => {
    const live = current[kind];
    delete current[kind];
    if (live) {
      if (dismissAfterSeconds > 0) lingering.add(kind);
      await native.end(live.id, last ? full(last) : null, dismissAfterSeconds);
    } else if (!lingering.has(kind)) await native.endAll(kind);
  });
}
