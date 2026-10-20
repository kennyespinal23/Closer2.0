import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

/**
 * Hands the day to Closer's Home Screen and Lock Screen widgets (targets/CloserWidget).
 * One JSON snapshot in the shared App Group; the widgets read it against the clock,
 * so they turn to night prayer at its hour and to a new day at midnight on their own.
 */
const APP_GROUP = "group.com.espinalcapital.closer";
const KEY = "closer.widget.snapshot";

export type WidgetSnapshot = {
  date: string;
  streak: number;
  keptToday: boolean;
  stepsDone: number;
  stepsTotal: number;
  step: { key: string; headline: string; title: string; label: string; art: string; tint: string } | null;
  verse: { text: string; reference: string; book: string; tint: string } | null;
  night: { enabled: boolean; hour: number; minute: number; doneDate: string | null } | null;
};

type Storage = { setString(key: string, value: string, group?: string): void; reloadWidget(kind?: string): void };
const storage = Platform.OS === "ios" ? requireOptionalNativeModule<Storage>("ExtensionStorage") : null;

let last = "";
export function syncWidgets(snapshot: WidgetSnapshot) {
  if (!storage) return;
  const json = JSON.stringify(snapshot);
  if (json === last) return;
  last = json;
  try {
    storage.setString(KEY, json, APP_GROUP);
    storage.reloadWidget();
  } catch {
    // Widgets are a mirror of the app; never let them break it.
  }
}

/** "1 Samuel 3:10" → "1-samuel", the painted cover's id. */
const BOOK_ALIASES: Record<string, string> = { psalm: "psalms", "song-of-songs": "song-of-solomon", songs: "song-of-solomon" };
export function bookIdFromReference(reference: string) {
  const id = (reference.match(/^(.+?)\s+\d/)?.[1] ?? reference).toLowerCase().replaceAll(" ", "-");
  return BOOK_ALIASES[id] ?? id;
}
