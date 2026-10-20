import { useCallback, useEffect, useRef, useState } from "react";
import type * as SpeechTypes from "expo-speech";
// Old TestFlight binaries may not include these native modules yet.
let Speech: typeof SpeechTypes | undefined;
let setAudioModeAsync: typeof import("expo-audio").setAudioModeAsync | undefined;
try { Speech = require("expo-speech"); } catch { /* available after a native update */ }
try { setAudioModeAsync = require("expo-audio").setAudioModeAsync; } catch { /* available after a native update */ }
import { fetchChapter } from "@/lib/bible";
import { findBookById } from "@/constants/books";
import { usePreferences } from "@/state/preferences";
import { paintedCover } from "@/constants/paintedCovers";
import { endActivity, showActivity } from "@/lib/liveActivity";

/**
 * Reads a chapter aloud with the iPhone's own voice, verse by verse.
 * The whole chapter is queued natively at once, so it keeps reading with the screen locked;
 * each verse reports when it starts, which drives the progress and the verse highlight.
 */

export type SpeechStatus = "idle" | "loading" | "playing" | "paused";

let voicePromise: Promise<string | undefined> | null = null;
/** The best English voice on this phone: a Premium or Enhanced one if the person has downloaded it. */
function bestVoice() {
  if (!Speech) return Promise.resolve(undefined);
  voicePromise ??= Speech.getAvailableVoicesAsync().then(voices => {
    const english = voices.filter(v => v.language?.startsWith("en"));
    const rank = (v: SpeechTypes.Voice) => (v.quality === "Enhanced" ? 0 : 2) + (v.language === "en-US" ? 0 : 1) + (/premium/i.test(v.identifier) ? -1 : 0) + (/eloquence|novelty|compact/i.test(v.identifier) ? 5 : 0);
    return english.sort((a, b) => rank(a) - rank(b))[0]?.identifier;
  }).catch(() => undefined);
  return voicePromise;
}

/** Text as it should be heard: poetry line breaks become pauses, small capitals LORD reads as Lord. */
function spoken(text: string) {
  return text.replace(/\s*\n\s*/g, ", ").replace(/\bLORD\b/g, "Lord").replace(/\bGOD\b/g, "God").replace(/[\[\]¶]/g, "").replace(/\s+/g, " ").trim();
}

// Only one chapter speaks at a time, across every screen.
let session = 0;
let audioModeSet = false;
const PACE = 0.82;
// A listening activity left over from a previous launch has nothing behind it now.
endActivity("listen");

export function useChapterSpeech({ bookId, chapter, rate = 1, onChapterEnd }: { bookId: string; chapter: number; rate?: number; onChapterEnd?: () => void }) {
  const { translation } = usePreferences();
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [verse, setVerse] = useState(0);
  const [verseCount, setVerseCount] = useState(0);
  const [verses, setVerses] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const mine = useRef(0), verseRef = useRef(0), statusRef = useRef<SpeechStatus>("idle"), endRef = useRef(onChapterEnd);
  endRef.current = onChapterEnd;
  const set = (s: SpeechStatus) => { statusRef.current = s; setStatus(s); };

  const play = useCallback(async (fromIndex = verseRef.current) => {
    if (!Speech || !setAudioModeAsync) { setError("Update Closer in TestFlight to listen to chapters."); return; }
    const token = ++session;
    mine.current = token;
    set("loading"); setError(undefined);
    try {
      await Speech?.stop();
      if (!audioModeSet) { await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "doNotMix" }); audioModeSet = true; }
      const [data, voice] = await Promise.all([fetchChapter(bookId, chapter, translation.id), bestVoice()]);
      if (session !== token) return;
      const verses = data.verses;
      setVerseCount(verses.length); setVerses(verses.map(v => v.text.replace(/\s*\n\s*/g, " ").trim()));
      const start = Math.min(Math.max(0, fromIndex), Math.max(0, verses.length - 1));
      verseRef.current = start; setVerse(start + 1);
      // iOS's default pace is brisk for scripture; Closer's 1× is a calmer reading pace.
      let silent = 0;
      const base = { voice, rate: rate * PACE, useApplicationAudioSession: true };
      if (start === 0) Speech!.speak(`${findBookById(bookId)?.name ?? data.reference}, chapter ${chapter}.`, base);
      verses.slice(start).forEach((v, i) => {
        const index = start + i, last = index === verses.length - 1;
        const text = spoken(v.text);
        let startedAt = 0;
        Speech!.speak(text, {
          ...base,
          onStart: () => { startedAt = Date.now(); if (session === token) { verseRef.current = index; setVerse(index + 1); } },
          onDone: () => {
            if (session !== token) return;
            if (!last) {
              // A verse that "finishes" in a blink was never heard: the phone couldn't open its audio. Stop rather than race ahead.
              if (text.length > 12 && Date.now() - startedAt < 150) { if (++silent >= 3) { session++; void Speech?.stop(); set("idle"); setError("Your iPhone couldn’t play the audio. Check the volume and try again."); } }
              else silent = 0;
              return;
            }
            // Hand over to the next chapter: it starts playing if the screen moves on, otherwise we rest.
            verseRef.current = 0; statusRef.current = "loading"; endRef.current?.();
            setTimeout(() => { if (session === token) set("idle"); }, 400);
          },
          onError: () => { if (session === token) { set("idle"); setError("The voice stopped. Tap play to try again."); } },
        });
      });
      set("playing");
    } catch {
      if (session === token) { set("idle"); setError("Couldn’t load this chapter. Check your connection and try again."); }
    }
  }, [bookId, chapter, rate, translation.id]);

  const pause = useCallback(() => { if (statusRef.current === "playing") { void Speech?.pause(); set("paused"); } }, []);
  const resume = useCallback(() => { if (statusRef.current === "paused" && session === mine.current) { void Speech?.resume(); set("playing"); } else void play(); }, [play]);
  const toggle = useCallback(() => { statusRef.current === "playing" ? pause() : statusRef.current === "paused" ? resume() : void play(); }, [pause, resume, play]);
  const stop = useCallback(() => { if (session === mine.current) { session++; void Speech?.stop(); endActivity("listen"); } set("idle"); }, []);
  const seek = useCallback((index: number) => { verseRef.current = index; setVerse(index + 1); if (statusRef.current !== "idle") void play(index); }, [play]);

  // A new chapter starts from its first verse, and keeps playing if it was playing.
  const wasPlaying = useRef(false);
  const chapterKey = `${bookId}:${chapter}:${translation.id}`, lastKey = useRef(chapterKey);
  useEffect(() => {
    if (lastKey.current === chapterKey) return;
    lastKey.current = chapterKey;
    wasPlaying.current = statusRef.current === "playing" || statusRef.current === "loading";
    verseRef.current = 0; setVerse(0); setVerseCount(0); setVerses([]);
    if (wasPlaying.current) void play(0); else stop();
  }, [chapterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // A new speed applies from the verse being read.
  const lastRate = useRef(rate);
  useEffect(() => {
    if (lastRate.current === rate) return;
    lastRate.current = rate;
    if (statusRef.current === "playing") void play(verseRef.current);
  }, [rate]); // eslint-disable-line react-hooks/exhaustive-deps

  // The Live Activity follows along: the book's cover, the chapter, the verse being read.
  useEffect(() => {
    if (status === "idle") { if (mine.current !== 0 && session === mine.current) endActivity("listen"); return; }
    const name = findBookById(bookId)?.name ?? bookId;
    showActivity("listen", { art: `c-${bookId}`, tint: paintedCover(bookId)?.color ?? "#A47D28" }, {
      kicker: status === "paused" ? "Paused" : "Listening",
      headline: `${name} ${chapter}`,
      detail: verseCount ? `Verse ${verse} of ${verseCount}` : "Getting the chapter ready",
      progress: verseCount ? verse / verseCount : 0,
      paused: status === "paused",
    });
  }, [status, verse, verseCount, bookId, chapter]);

  useEffect(() => () => { if (session === mine.current) { session++; void Speech?.stop(); endActivity("listen"); } }, []);

  return { status, playing: status === "playing", loading: status === "loading", verse, verseCount, verses, error, play, pause, resume, toggle, stop, seek };
}
