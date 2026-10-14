import { useEffect, useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cancelNightPrayerReminder, getNotificationPermission, requestNotificationPermission, scheduleNightPrayerReminder } from "@/lib/notifications";

/**
 * Night prayer: a card on Home after a time you choose. You say how today
 * felt, pick what to pray for, and a prayer is put together from both.
 */
export type NightPrayerSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
  /** What you usually pray for at night, chosen in Settings. Preselected in the flow. */
  topics: string[];
  /** The night (YYYY-MM-DD of the evening) you last said Amen. */
  lastPrayed: string | null;
  /** Dev only: show the card at any hour, even after praying. */
  devAlways: boolean;
  /** Every night you said Amen, newest first. */
  log: NightPrayerEntry[];
};
export type NightPrayerEntry = { night: string; at: number; feelings: string[]; topics: string[]; answeredAt?: number };

export const NIGHT_TOPICS = ["Hope", "Faith", "Strength", "Wisdom", "Peace", "Rest", "Family", "Health", "Success", "Life", "Courage", "Patience", "Provision", "Forgiveness"] as const;
export const NIGHT_FEELINGS = {
  carrying: ["Tired", "Worried", "Anxious", "Lonely", "Overwhelmed", "Sad", "Stressed"],
  holding: ["Grateful", "Peaceful", "Loved", "Hopeful", "Forgiven"],
} as const;

const KEY = "closer.nightPrayer.v1";
const DEFAULTS: NightPrayerSettings = { enabled: true, hour: 21, minute: 0, topics: ["Peace", "Strength"], lastPrayed: null, devAlways: false, log: [] };
const listeners = new Set<() => void>();
let snapshot: NightPrayerSettings & { hydrated: boolean } = { ...DEFAULTS, hydrated: false };
let loading: Promise<void> | null = null;
const emit = () => listeners.forEach(l => l());

function hydrate() {
  if (snapshot.hydrated) return Promise.resolve();
  loading ??= AsyncStorage.getItem(KEY).then(raw => {
    const saved = raw ? JSON.parse(raw) as Partial<NightPrayerSettings> : {};
    snapshot = { ...DEFAULTS, ...saved, hydrated: true };
    void syncNotification(false);
  }).catch(() => { snapshot = { ...snapshot, hydrated: true }; }).finally(() => { loading = null; emit(); });
  return loading;
}

export function updateNightPrayer(patch: Partial<NightPrayerSettings>) {
  snapshot = { ...snapshot, ...patch };
  emit();
  const { hydrated: _h, ...save } = snapshot;
  void AsyncStorage.setItem(KEY, JSON.stringify(save)).catch(() => {});
  if ("enabled" in patch || "hour" in patch || "minute" in patch) {
    // Nudging the time fires many updates; schedule once it settles.
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => { syncTimer = null; void syncNotification(patch.enabled === true || "hour" in patch || "minute" in patch); }, 400);
  }
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;
/** The night notification follows the setting. Asks for permission only when you turn it on. */
async function syncNotification(ask: boolean) {
  try {
    if (!snapshot.enabled) { await cancelNightPrayerReminder(); return; }
    const status = ask ? await requestNotificationPermission() : await getNotificationPermission();
    if (status !== "granted") return;
    await scheduleNightPrayerReminder({ hour: snapshot.hour, minute: snapshot.minute });
  } catch { /* scheduling is best effort; the Home card still shows */ }
}

/** The evening a moment belongs to: before 4am still counts as last night. */
export function nightKey(now = new Date()) {
  const d = new Date(now);
  if (d.getHours() < 4) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Saying Amen: marks tonight done and keeps what you prayed for. */
export function recordNightPrayer(feelings: string[], topics: string[]) {
  const night = nightKey();
  updateNightPrayer({ lastPrayed: night, log: [{ night, at: Date.now(), feelings, topics, answeredAt: snapshot.log.find(e => e.night === night)?.answeredAt }, ...snapshot.log.filter(e => e.night !== night)].slice(0, 400) });
}

/** Mark a night's prayer answered, or not. */
export function setNightPrayerAnswered(night: string, answered: boolean) {
  updateNightPrayer({ log: snapshot.log.map(e => e.night === night ? { ...e, answeredAt: answered ? Date.now() : undefined } : e) });
}

/** Tonight's prayer is said: the card stays, marked done, until 4am. */
export function tonightsNightPrayer(s: NightPrayerSettings, now = new Date()) {
  return s.lastPrayed === nightKey(now) ? s.log.find(e => e.night === s.lastPrayed) ?? null : null;
}

export function isNightPrayerDue(s: NightPrayerSettings, now = new Date()) {
  if (s.lastPrayed === nightKey(now)) return false;
  if (s.devAlways) return true;
  if (!s.enabled) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= s.hour * 60 + s.minute || mins < 4 * 60;
}

export function formatNightTime(hour: number, minute: number) {
  const h = hour % 12 || 12;
  return `${h}:${String(minute).padStart(2, "0")} ${hour < 12 ? "am" : "pm"}`;
}

export function useNightPrayer() {
  const state = useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => snapshot);
  useEffect(() => { void hydrate(); }, []);
  return state;
}

const TOPIC_LINE: Record<string, string> = {
  Hope: "Give me hope that holds, even when I can’t see the way.",
  Faith: "Grow my faith. Help me trust you with what I can’t control.",
  Strength: "Be my strength for whatever tomorrow asks of me.",
  Wisdom: "Give me wisdom for the choices in front of me.",
  Peace: "Quiet my mind and fill this room with your peace.",
  Rest: "Give me deep rest tonight, the kind only you can give.",
  Family: "Watch over my family. Keep them close to you.",
  Health: "Guard my health, and heal what hurts.",
  Success: "Bless the work of my hands, and let it honour you.",
  Life: "Thank you for my life. Help me live it well, and live it for you.",
  Courage: "Give me courage for what I’ve been avoiding.",
  Patience: "Make me patient with others, and with myself.",
  Provision: "Provide what I need, and help me trust that you will.",
  Forgiveness: "Forgive me where I fell short today, and help me forgive too.",
};

const list = (words: string[]) => words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;

/** The prayer, built from what you said. Lines marked `yours` are the things you chose to pray for. */
export function composeNightPrayer(feelings: string[], topics: string[]): { text: string; yours?: boolean }[] {
  const carrying = feelings.filter(f => (NIGHT_FEELINGS.carrying as readonly string[]).includes(f)).map(f => f.toLowerCase());
  const holding = feelings.filter(f => (NIGHT_FEELINGS.holding as readonly string[]).includes(f)).map(f => f.toLowerCase());
  const lines: { text: string; yours?: boolean }[] = [{ text: "Father, today is done, and I give it back to you." }];
  if (carrying.length) lines.push({ text: `I’m ${list(carrying)} tonight. Thank you that I don’t carry it alone.` });
  if (holding.length) lines.push({ text: `${carrying.length ? "And I’m" : "I’m"} ${list(holding)}. Thank you for every good thing today.` });
  if (!feelings.length) lines.push({ text: "You know how today went, even the parts I can’t name." });
  topics.slice(0, 3).forEach(t => TOPIC_LINE[t] && lines.push({ text: TOPIC_LINE[t], yours: true }));
  lines.push({ text: "Hold me while I sleep, and wake me ready for tomorrow. Amen." });
  return lines;
}
