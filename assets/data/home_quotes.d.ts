/**
 * Type declaration for `home_quotes.json`.
 *
 * Segmented home prompts — entire quote body in Shantell Sans Bold.
 * JSON may still tag segments `"caveat"` / `"sans-bold"` for color and
 * underline accents only; the face is unified at render time.
 */

export type HomeQuoteFont = "caveat" | "sans-bold";

export type HomeQuoteSegment = {
  text: string;
  font: HomeQuoteFont;
  color: string;
  underline?: boolean;
  underlineColor?: string;
};

export type HomeQuote = {
  id: string;
  segments: ReadonlyArray<HomeQuoteSegment>;
  reference?: string;
};

declare const HOME_QUOTES_FILE: {
  quotes: ReadonlyArray<HomeQuote>;
};

export default HOME_QUOTES_FILE;
