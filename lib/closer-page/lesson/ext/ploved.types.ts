import type { Cue, Line, Theme, Verse } from "../types";

/* You Are Still Loved: this experience's own block kinds. Every kind here starts with "ploved". */

/** The poem itself, one line at a time under a reading lamp. Page goes quiet in the corner. Before one stanza the
    reader is invited to hold the lamp and take a breath; letting go early just lets the light settle back. */
export type PoemPane = {
  kind: "plovedPoem"; theme?: Theme; page?: Cue;
  /** what Page says before he goes quiet */
  before: Line[];
  title: string;
  /** the stanzas, line by line */
  stanzas: string[][];
  /** before this stanza (its index), the breath */
  breathe: { at: number; hint: string; holding: string; skip: string };
  /** what Page says once the last line has been read */
  after: Line;
  again: string;
};

/** Where the poem leans: tap a line of the poem to open the Scripture beneath it. The poem is labelled as a poem,
    the passages as Scripture, so the two are never confused. */
export type EchoPane = {
  kind: "plovedEchoes"; theme?: Theme; page?: Cue;
  before: Line[];
  hint: string;
  echoes: { line: string; verse: Verse; say: string }[];
  after: Line;
};

/** An optional closing prayer: pray it, or leave it */
export type PrayerPane = {
  kind: "plovedPrayer"; theme?: Theme; page?: Cue;
  ask: Line;
  pray: string; skip: string;
  /** the prayer, a line at a time */
  lines: string[];
  amen: string;
  /** what Page says if you leave it */
  left: string;
};

export type Blocks = PoemPane | EchoPane | PrayerPane;
