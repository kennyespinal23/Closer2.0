import type { Cue, Theme, Verse } from "../types";

/* A Little Reminder: this experience's own block kinds. Every kind here starts with "remind". */

/** One thing to remember, and the passage it rests on */
export type Truth = { line: string; verse: Verse };

/** The whole pause, as one unbroken scene: Page says hello and sets the learning aside, then the four truths come one
    at a time while the light rises, then all four together to read again, then a short prayer. */
export type Pause = {
  kind: "remindPause"; theme?: Theme; page?: Cue;
  /** "Hi, {name}." when a first name was given in the first run, otherwise `plain` */
  hello: { named: string; plain: string };
  /** the rest of Page's hello, one line at a time */
  lines: string[];
  /** Page handing over to Scripture, so he never speaks for God */
  pointTo: string;
  truths: Truth[];
  again: { say: string; reread: string; go: string };
  prayer: { invite: string; label: string; sentences: string[]; amen: string };
  /** a quiet hint under a scene that moves on with a tap */
  tapHint: string;
};

export type Blocks = Pause;
