/**
 * One audio session for the whole app, shared by two kinds of sound:
 *   • "effects": Closer's little sounds. They mix with whatever the person is listening to and
 *     stay quiet when the phone's silent switch is on (like Duolingo).
 *   • "speech": a chapter read aloud. It plays even on silent and keeps going in the background.
 * The session is switched only when the kind changes, and the reader hands it back when it stops.
 */
// Old TestFlight binaries may not include the native module yet.
let setAudioModeAsync: typeof import("expo-audio").setAudioModeAsync | undefined;
try { setAudioModeAsync = require("expo-audio").setAudioModeAsync; } catch { /* available after a native update */ }

type Kind = "effects" | "speech";
let current: Kind | null = null;

export async function audioSessionFor(kind: Kind) {
  if (!setAudioModeAsync || current === kind) return;
  current = kind;
  await (kind === "speech"
    ? setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "doNotMix" })
    : setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false, interruptionMode: "mixWithOthers" })
  ).catch(() => { current = null; });
}

/** Is a chapter being read aloud right now? Effects don't take the session from it. */
export const speechActive = { on: false };
