import RED_LETTER from "@/assets/bibles/red-letter-keys.json";

/**
 * Red-letter (words of Jesus) — classic Bible printing convention.
 * Keys are translation-agnostic `bookId:chapter:verse` markers for
 * verses where Christ speaks (Gospels, Acts, Revelation).
 */

const KEYS: ReadonlySet<string> = new Set(
  (RED_LETTER as { keys: string[] }).keys ?? [],
);

/** Classic crimson for light canvases; brighter for dark. */
export function redLetterColor(scheme: "light" | "dark"): string {
  return scheme === "dark" ? "#FF6B6B" : "#C41E3A";
}

export function isRedLetterVerse(
  bookId: string,
  chapter: number,
  verse: number,
): boolean {
  return KEYS.has(`${bookId}:${chapter}:${verse}`);
}
