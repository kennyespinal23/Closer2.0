import type { Cue, Line, Person, Theme, Verse } from "../types";

/* Who Is the Holy Spirit?: this experience's own block kinds. Every kind here starts with "spirit". */

/** Window one, the baptism: guide the dove down from the opened heavens; the passage lights up as it comes */
export type DovePane = {
  kind: "dove"; title: string; ref: string; teaser: string; hint: string;
  verse: Verse; phrases: { phrase: string; say: string }[];
  voice: Verse; trio: { who: Person; label: string }[]; done: string;
};
/** Window two, the upper room: tap the words that describe the Counselor; each one drops what he does onto a card */
export type WordsPane = {
  kind: "words"; title: string; ref: string; teaser: string; hint: string;
  verses: Verse[]; marks: { phrase: string; does: string; say: string }[];
  heading: string; reveal: string;
  /** commentary on the passage, labelled as such: never Scripture */
  note: { label: string; text: string }; done: string;
};
/** Window three, Pentecost: hold for the wind, then the flames come, then the languages */
export type FirePane = {
  kind: "fire"; title: string; ref: string; teaser: string; hold: string;
  verses: Verse[]; people: number;
  /** "the mighty works of God" as the crowd heard it (Acts 2:11), each labelled with its language */
  languages: { lang: string; text: string; rtl?: boolean }[];
  heard: Verse; done: string;
};
export type Pane = DovePane | WordsPane | FirePane;

export type Blocks =
  /** Three Windows into Scripture: open each window in any order; each scene has its own interaction */
  | { kind: "spiritWindows"; theme?: Theme; page?: Cue; before: Line[]; hint: string; panes: Pane[]; after: Line[] }
  /** Someone, not something: tap what the Spirit does in each passage and a needle swings from "something" to
      "someone"; then the passages that put him on God's side of the line */
  | {
      kind: "spiritPerson"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      meter: [string, string];
      actions: { verse: Verse; verb: string; does: string; say: string }[];
      wow: Line[];
      identityHint: string;
      identity: { verse: Verse; mark: string; note: string; say: string }[];
      summary: { title: string; lines: string[] };
      after: Line[];
    };
