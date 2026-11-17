import type { Cue, Theme, Verse } from "../types";

/* How Close Do You Feel to God?: this experience's own block kinds. Every kind here starts with "hclose". */

/** Where you can put yourself on the road home. Each is a feeling drawn as a place, never a measure. */
export type Place = "porch" | "road" | "far" | "fog" | "moves";

/** What Page says and shows when you choose a place, and the one gentle question that follows */
export type Branch = {
  /** how the place is named on its chip, and in what's kept if you choose to keep it */
  label: string;
  /** Page's first reply (one or two short lines) */
  reply: string;
  /** a line before the verse, setting it up */
  lead: string;
  verse: Verse;
  /** the follow-up: a question with a few honest answers, each met with its own reply */
  follow?: { ask: string; options: { text: string; reply: string }[] };
};

/** A choice in the revisit, when there's an earlier answer to come back to */
export type Since = { text: string; reply: string };

export type Blocks =
  /** The conversation: (if you kept something before) a look back, then the road home. Place yourself on it by
      tapping or dragging the lantern; Page answers where you are, with Scripture, and asks one more thing. */
  | {
      kind: "hcloseTalk"; theme?: Theme; page?: Cue;
      /** first time: how Page sets up the picture */
      intro: string[];
      /** coming back: "Last time, {when}, you told me “{said}”." then the question */
      back: { hello: string; recall: string; ask: string; options: Since[]; key: string };
      /** after a long while (60 days or more since the first thing you kept): a word to your earlier self */
      letter: { ask: string; placeholder: string; write: string; skip: string; thanks: string };
      /** asked over the picture, the first time and on coming back */
      ask: { first: string; again: string };
      hint: string;
      places: Record<Place, Branch>;
      /** a path that's always open */
      decline: { label: string; reply: string; verse: Verse; lead: string };
    }
  /** The slow end: an optional line in your own words, then (only if there's something) the choice to keep it, shown
      exactly as it would be kept; then a prayer you can pray, or not. */
  | {
      kind: "hcloseKeep"; theme?: Theme; page?: Cue;
      write: { ask: string; placeholder: string; yes: string; no: string };
      keep: { ask: string; detail: string; yes: string; no: string; kept: string; notKept: string };
      prayer: { offer: string; yes: string; no: string; label: string; text: string; note: string };
    };
