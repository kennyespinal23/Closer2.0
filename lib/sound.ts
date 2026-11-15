/**
 * Closer's sounds: "Warm wood" (marimba-like plucks in one key, made by
 * ~/Desktop/closer-redesign/sounds/make-sounds.mjs). Sound is for moments that mean something;
 * ordinary taps only buzz. Respects the Sounds setting and the phone's silent switch.
 */
import type { AudioPlayer } from "expo-audio";
import { audioSessionFor, speechActive } from "@/lib/audioSession";
import { closerSettings } from "@/state/closerPage";

let createAudioPlayer: typeof import("expo-audio").createAudioPlayer | undefined;
try { createAudioPlayer = require("expo-audio").createAudioPlayer; } catch { /* available after a native update */ }

const FILES = {
  reveal: require("@/assets/sounds/reveal.wav"),
  right: require("@/assets/sounds/right.wav"),
  wrong: require("@/assets/sounds/wrong.wav"),
  cross: require("@/assets/sounds/cross.wav"),
  heart: require("@/assets/sounds/heart.wav"),
  done: require("@/assets/sounds/done.wav"),
  streak: require("@/assets/sounds/streak.wav"),
  letter: require("@/assets/sounds/letter.wav"),
} as const;
export type SoundName = keyof typeof FILES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};
function player(name: SoundName) {
  if (!createAudioPlayer) return undefined;
  try { return (players[name] ??= createAudioPlayer(FILES[name])); } catch { return undefined; }
}

/** Load the players ahead of time so the first sound isn't late. */
export function preloadSounds() {
  (Object.keys(FILES) as SoundName[]).forEach(player);
}

export function playSound(name: SoundName) {
  if (!closerSettings().sound) return;
  const p = player(name);
  if (!p) return;
  const go = () => { try { p.volume = 0.8; void p.seekTo(0); p.play(); } catch { /* sound is best-effort */ } };
  if (speechActive.on) go();
  else void audioSessionFor("effects").then(go);
}
