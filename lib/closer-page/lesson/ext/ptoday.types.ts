import type { Mood } from "../../page/states";
import type { Cue, Theme, Verse } from "../types";

/* Thank You for Today: this experience's own block kinds. Every kind here starts with "ptoday".
   A gratitude poem written with the person: they gather small things from their day, and each one brings its own
   pre-written lines into the poem, always in the same pleasing order, between a fixed opening and closing.
   Nothing they pick or type is saved: it lives only in this lesson while it's open. */

export type PtodayIcon = "light" | "cup" | "walk" | "meal" | "laugh" | "message" | "song" | "rest" | "sprout" | "through";

/** one small thing from a day, and the two lines it brings into the poem */
export type PtodayItem = {
  id: string; icon: PtodayIcon;
  /** on its chip */
  label: string;
  /** in the closing prayer: "thank you for ___" */
  short: string;
  lines: [string, string];
};

/** how the day went decides the poem's opening and closing */
export type PtodayDay = "good" | "hard";
export type PtodayFrame = { opening: string[]; closing: string[] };

/** the poem itself: shared by the gathering, the reading and the prayer */
export type PtodayPoem = {
  title: string; byline: string;
  frames: Record<PtodayDay, PtodayFrame>;
  /** in the poem's order */
  items: PtodayItem[];
  /** something of their own: `line` has "{text}" where their words go; `short` is used in the prayer */
  own: { label: string; ask: string; placeholder: string; line: string; max: number };
};

export type Blocks =
  /** How was today, honestly? Then tap three to five small things; the poem builds on a page as you pick */
  | {
      kind: "ptodayGather"; theme?: Theme; page?: Cue;
      poem: PtodayPoem;
      ask: string;
      days: Record<PtodayDay, { text: string; reply: string; mood: Mood }>;
      /** what's said in the block once picking starts */
      pick: string; min: number; max: number;
      /** said quietly under the field: nothing is kept */
      privacy: string;
      button: string;
    }
  /** The poem, whole, set on its page line by line; optionally read aloud */
  | { kind: "ptodayPoem"; theme?: Theme; page?: Cue; poem: PtodayPoem; done: string }
  /** What Scripture says about thanks: kept apart from the poem, and chosen by how the day went */
  | {
      kind: "ptodayWord"; theme?: Theme; page?: Cue;
      label: string;
      say: Record<PtodayDay, string>;
      verses: Record<PtodayDay, { verse: Verse; note?: string }[]>;
    }
  /** An optional prayer, made from what they picked */
  | {
      kind: "ptodayPray"; theme?: Theme; page?: Cue;
      poem: PtodayPoem;
      ask: string; pray: string; skip: string;
      /** "{list}" is where the picks go */
      prayer: Record<PtodayDay, string>;
      amen: string;
    };
