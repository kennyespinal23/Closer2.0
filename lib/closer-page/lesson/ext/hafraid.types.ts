import type { Cue, Line, Theme, Verse } from "../types";

/* Is There Something You’ve Been Afraid to Tell God?: this experience's own block kinds. Every kind here starts
   with "hafraid". Nothing is asked about what the thing is; only, if you like, what kind of thing. */

/** One kind of thing someone might be carrying. Never a category of person: just where Page's words start from. */
export type AfraidKind = {
  id: "did" | "feel" | "fear" | "hurt" | "unsaid";
  /** the button, in the person's own voice */
  label: string;
  /** Page's answer, in a line or two each */
  reply: Line[];
  /** the passage that meets this kind of thing */
  verse: Verse;
  /** what Page says after the passage */
  after: string;
  /** words for the prayer at the slip, in the person's voice */
  prayer: string;
  /** some things are too heavy to carry alone: show the gentle line about people who can help */
  heavy?: boolean;
};

export type Blocks =
  /** Making it safe: he already knows (Psalm 139), pour it out (Psalm 62), come boldly (Hebrews 4). If something
      hard was kept from an earlier time, Page first asks, gently, how it's being carried now. */
  | {
      kind: "hafraidSafe"; theme?: Theme; page?: Cue;
      lines: Line[];
      verses: { verse: Verse; say: string }[];
      /** the return beat, only when an earlier answer was kept */
      back: { ask: string; options: { text: string; reply: string }[]; show: string; shown: string; hide: string };
      done: string;
    }
  /** What kind of thing is it? Five answers, one of them "I'd rather not say"; each gets its own words and passage */
  | { kind: "hafraidKind"; theme?: Theme; page?: Cue; ask: string; note: string; kinds: AfraidKind[] }
  /** The slip: write it (a word, or nothing), fold it, hold to give it to God; then let it go (the default) or,
      only if asked for, keep a private note of it */
  | {
      kind: "hafraidSlip"; theme?: Theme; page?: Cue;
      /** the question as Page asks it, kept with any note */
      question: string;
      kinds: AfraidKind[];
      write: Line[]; placeholder: string; fold: string; empty: string;
      hold: string; given: Line[];
      choose: { ask: string; letGo: string; keep: string; consent: string[]; confirm: string; back: string; letGoSay: string; keptSay: string };
      /** some things are too heavy to carry alone */
      heavy: { title: string; text: string; crisis: string };
    };
