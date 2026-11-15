/**
 * The moments that get feedback, each a sound and a buzz together (CLOSER-PICKS.md, Sounds:
 * warm wood, key moments only, Duolingo-strength buzzes, Page silent).
 */
import * as Haptics from "expo-haptics";
import { playSound } from "@/lib/sound";

export type Moment = "reveal" | "right" | "wrong" | "cross" | "heart" | "done" | "streak" | "letter";

const later = (ms: number, f: () => void) => setTimeout(f, ms);
const impact = (s: Haptics.ImpactFeedbackStyle) => { void Haptics.impactAsync(s).catch(() => {}); };
const notify = (s: Haptics.NotificationFeedbackType) => { void Haptics.notificationAsync(s).catch(() => {}); };

export function feel(m: Moment) {
  playSound(m);
  switch (m) {
    case "reveal": impact(Haptics.ImpactFeedbackStyle.Medium); break;
    case "right": notify(Haptics.NotificationFeedbackType.Success); break;
    case "wrong": notify(Haptics.NotificationFeedbackType.Warning); break;
    case "cross": impact(Haptics.ImpactFeedbackStyle.Rigid); later(380, () => notify(Haptics.NotificationFeedbackType.Success)); break;
    case "heart": impact(Haptics.ImpactFeedbackStyle.Soft); break;
    case "done": notify(Haptics.NotificationFeedbackType.Success); break;
    case "streak": notify(Haptics.NotificationFeedbackType.Success); later(320, () => notify(Haptics.NotificationFeedbackType.Success)); break;
    case "letter": impact(Haptics.ImpactFeedbackStyle.Light); break;
  }
}
