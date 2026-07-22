/**
 * Type declaration for `home_quotes.json`.
 *
 * Segmented home prompts — handwritten (Kalam; JSON tag `"caveat"`)
 * + bold sans, with optional per-segment underline accents.
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
