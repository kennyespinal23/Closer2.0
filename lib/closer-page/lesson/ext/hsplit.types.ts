import type { Cue, Line, Theme, Verse } from "../types";

/* Why Did Christianity Split?: this experience's own block kinds. Every kind here starts with "hsplit".
   Three families of churches appear throughout, always in the same colours, and always described in terms their
   own members would recognise: Orthodox (East), Catholic (West) and Protestant. The Oriental Orthodox churches
   appear at Chalcedon. No family is ever declared right. */

export type HSplitFamily = "oriental" | "orthodox" | "catholic" | "protestant";

/** One stop on the river: a year, what happened, and what Page says when you reach it */
export type HSplitStop = { year: number; label: string; title: string; body: string; say: string };

/** One of the tensions between East and West that had built up for centuries */
export type HSplitThread = { id: string; name: string; east: string; west: string; say: string };

/** One family's answer to a deep question, in its own words */
export type HSplitVoice = { family: Exclude<HSplitFamily, "oriental">; view: string; leans: string; say: string };

/** A belief on the overlay: shared by everyone, or one family's own */
export type HSplitBelief = { text: string; families: Exclude<HSplitFamily, "oriental">[] };

export type Blocks =
  /** The river of the church: scrub through two thousand years and watch one stream divide */
  | { kind: "hsplitRiver"; theme?: Theme; page?: Cue; before: Line[]; hint: string; stops: HSplitStop[]; today: { text: string; source: string }; after: Line[] }
  /** 1054: inspect each thread between East and West, then live through 1054, 1204 and 1965 */
  | {
      kind: "hsplitThreads"; theme?: Theme; page?: Cue; before: Line[]; hint: string; threads: HSplitThread[];
      events: { year: string; title: string; body: string; say: string }[]; after: Line[];
    }
  /** 1517: post the theses, then hear three families answer two deeper questions */
  | {
      kind: "hsplitDoor"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      door: { title: string; body: string; note: string; say: string };
      questions: { q: string; voices: HSplitVoice[] }[];
      agreement: { title: string; body: string; say: string };
      after: Line[];
    }
  /** What they still share: lay three sheets on a light table and see what lines up */
  | {
      kind: "hsplitShared"; theme?: Theme; page?: Cue; before: Line[]; hint: string; beliefs: HSplitBelief[];
      verses: Verse[]; after: Line[];
    };
