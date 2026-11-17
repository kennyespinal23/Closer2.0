import type { Cue, Line, Theme, Verse } from "../types";

/* When I Feel Far Away: this experience's own block kinds. Every kind here starts with "pfar". */

/** One stretch of the road: walk it, and a stanza comes up out of the dark when you reach its end */
export type Stretch = {
  /** the stanza, one string per line; "" is a breath (a blank line) */
  lines: string[];
  /** Scripture carried by this stretch, shown under the stanza, labelled, never mixed into the poem */
  verse?: Verse;
  /** how dark the night is on this stretch, 0 (clear) to 1 (no stars) */
  dark: number;
};

export type Blocks =
  /** The road home at night. Hold to walk the lantern forward; each stretch ends in a stanza. On the last stretch
      the light in the far window starts to move: it comes down the road to you, and the night turns to dawn. */
  | {
      kind: "pfarRoad"; theme?: Theme; page?: Cue;
      /** Page's lines before the walk (then he steps out of the way) */
      before: Line[];
      hold: string; walking: string;
      stretches: Stretch[];
      /** the turn: what Page says to stop you walking, then the stanza as the light comes */
      stop: string; turn: string[];
      /** the passage the turn comes from, after the dawn */
      verse: Verse;
      /** the last stanza, at dawn */
      close: string[];
      after: Line[];
    }
  /** The whole poem on one page, to read again slowly, with its passages listed below */
  | { kind: "pfarPage"; theme?: Theme; page?: Cue; title: string; stanzas: string[][]; refs: string[]; say: string }
  /** An optional closing prayer: pray it, or carry on */
  | { kind: "pfarAmen"; theme?: Theme; page?: Cue; ask: string; pray: string; skip: string; prayer: string; after: string };
