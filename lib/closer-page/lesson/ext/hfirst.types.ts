import type { Cue, Line, Theme, Verse } from "../types";

/* What Happened to the First Christians?: this experience's own block kinds. Every kind here starts with "hfirst". */

/** How a piece of the story stands: in Scripture, in the historical record, an early tradition, or a rough estimate */
export type HfirstTag = "text" | "record" | "tradition" | "estimate";

/** A city on the map of the Roman world */
export type HfirstStop = {
  id: string; name: string; year: string; at: [number, number];
  /** what happened here, in a sentence or two */
  text: string; tag: HfirstTag; verse?: Verse; say: string;
  /** put its label on the left of the dot, clear of a neighbour */
  left?: boolean;
  /** or above it */
  above?: boolean;
};

/** A clue phrase inside a document: tap it to read what it tells us */
export type HfirstClue = { phrase: string; tells: string; say: string; reading?: boolean };

/** A primary source, paraphrased: who wrote it, to whom, when, and the clues in it */
export type HfirstDoc = {
  id: string; tab: string; from: string; when: string; source: string;
  /** the paraphrase, with each clue phrase appearing in it word for word */
  text: string; clues: HfirstClue[];
  /** what this document adds up to, once every clue is open */
  sum: string;
};

/** A moment on the timeline from AD 30 to 313 */
export type HfirstEvent = {
  year: number; label: string; place: string;
  /** for a campaign that lasted: the year it ended */
  until?: number;
  /** "local": one city or province for a time; "empire": an empire-wide campaign */
  scope: "local" | "empire" | "peace";
  text: string; tag: HfirstTag; verse?: Verse; say: string;
};

export type Blocks =
  /** The faith spreads: tap the next glowing city to follow it from Jerusalem across the Roman world */
  | { kind: "hfirstMap"; theme?: Theme; page?: Cue; before: Line[]; hint: string; stops: HfirstStop[]; beyond: { name: string; at: [number, number]; year: string }[]; beyondSay: string; after: Line[] }
  /** The investigation: two documents written by Romans who were not Christians. Tap every clue. */
  | { kind: "hfirstDocs"; theme?: Theme; page?: Cue; before: Line[]; hint: string; docs: HfirstDoc[]; note: string; after: Line[] }
  /** Scrub the years: persecution came in waves, local and then empire-wide, with long quiet stretches between */
  | { kind: "hfirstYears"; theme?: Theme; page?: Cue; before: Line[]; hint: string; events: HfirstEvent[]; finding: string; after: Line[] }
  /** Why it spread anyway: open what witnesses saw, then hold to watch the church grow (rough estimates, labelled) */
  | {
      kind: "hfirstGrow"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      witnesses: { id: string; who: string; when: string; text: string; source: string; say: string; verse?: Verse }[];
      hold: string; points: { year: number; people: number }[]; estimate: string; finding: string; after: Line[];
    };
