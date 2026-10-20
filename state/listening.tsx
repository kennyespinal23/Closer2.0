import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { findBookById } from "@/constants/books";
import { useChapterSpeech } from "@/lib/chapterSpeech";

/**
 * One reader-aloud for the whole app. The Listen screen, the reader's mini player and the verse
 * highlight all read from here, so the voice keeps going as you move between them.
 */
type Target = { bookId: string; chapter: number };
type Listening = {
  target: Target | null;
  rate: number;
  setRate: (rate: number) => void;
  /** Points the player at a chapter. If it was already reading, the new chapter starts reading. */
  open: (bookId: string, chapter: number) => void;
  /** Starts reading a chapter aloud from one verse (0-based index). */
  playFrom: (bookId: string, chapter: number, verseIndex: number) => void;
  speech: ReturnType<typeof useChapterSpeech>;
  /** True while there is something to show a player for. */
  active: boolean;
};

const ListeningContext = createContext<Listening | null>(null);
const RATES = [0.75, 1, 1.25, 1.5];
export const nextRate = (rate: number) => RATES[(RATES.indexOf(rate) + 1) % RATES.length]!;

export function ListeningProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<Target | null>(null);
  const [rate, setRate] = useState(1);
  const open = useCallback((bookId: string, chapter: number) => {
    setTarget(t => t && t.bookId === bookId && t.chapter === chapter ? t : { bookId, chapter });
  }, []);
  // When a chapter ends, the next one begins, until the book is done.
  const speech = useChapterSpeech({
    bookId: target?.bookId ?? "genesis", chapter: target?.chapter ?? 1, rate,
    onChapterEnd: () => setTarget(t => { const book = t && findBookById(t.bookId); return t && book && t.chapter < book.chapters ? { ...t, chapter: t.chapter + 1 } : t; }),
  });
  // Listen from a verse: point at the chapter, then start once the player has switched to it.
  const pending = useRef<{ key: string; index: number } | null>(null);
  const [request, setRequest] = useState(0);
  const playFrom = useCallback((bookId: string, chapter: number, verseIndex: number) => {
    pending.current = { key: `${bookId}:${chapter}`, index: verseIndex };
    setTarget(t => t && t.bookId === bookId && t.chapter === chapter ? t : { bookId, chapter });
    setRequest(r => r + 1);
  }, []);
  useEffect(() => {
    const p = pending.current;
    if (p && target && p.key === `${target.bookId}:${target.chapter}`) { pending.current = null; void speech.play(p.index); }
  }, [target, request]); // eslint-disable-line react-hooks/exhaustive-deps
  const value = useMemo(() => ({ target, rate, setRate, open, playFrom, speech, active: !!target && speech.status !== "idle" }), [target, rate, open, playFrom, speech]);
  return <ListeningContext.Provider value={value}>{children}</ListeningContext.Provider>;
}

export function useListening() {
  const value = useContext(ListeningContext);
  if (!value) throw new Error("useListening needs ListeningProvider");
  return value;
}

/** The verse being read aloud in this chapter, or null. For the reader's highlight. */
export function useSpeakingVerse(bookId: string, chapter: number) {
  const value = useContext(ListeningContext);
  if (!value?.active || value.target?.bookId !== bookId || value.target.chapter !== chapter || !value.speech.verse) return null;
  return value.speech.verse;
}
