import type { Cue, Line, Theme, Verse } from "../types";

/* How Did We Get the Bible?: this experience's own block kinds. Every kind here starts with "hbible". */

/** How sure the history is: what the record shows, what scholars estimate, and what is still argued over */
export type HistTag = "record" | "estimate" | "debated";
export type HistNote = { tag: HistTag; text: string };

/** a card in the sort: where Eusebius put it, and what Page says when it lands */
export type Writing = { id: string; name: string; what: string; bin: "recognised" | "disputed" | "not" | "either"; say: string };

export type Blocks =
  /** The copying chain: hold to copy a line by hand, send copies city to city, then spot the slip a tired scribe made */
  | {
      kind: "hbibleCopy"; theme?: Theme; page?: Cue; before: Line[];
      hold: string; verse: Verse;
      cities: string[]; spread: string;
      /** the same line in three copies; one copy changes one word */
      compare: { hint: string; words: string[]; slip: { copy: number; word: number; reads: string }; found: string; miss: string };
      notes: HistNote[]; after: Line[];
    }
  /** The oldest witnesses: drag back through time; each manuscript opens as the handle passes it */
  | {
      kind: "hbibleWitness"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      from: number; to: number;
      witnesses: { id: "isaiah" | "p52" | "p46" | "sinai"; year: number; date: string; name: string; where: string; body: string; tag: HistTag; verse?: Verse; say: string }[];
      after: Line[];
    }
  /** The sort: place early Christian writings where the church of Eusebius's day had them */
  | {
      kind: "hbibleSort"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      bins: { id: "recognised" | "disputed" | "not"; name: string; sub: string }[];
      writings: Writing[]; nudge: string; source: string;
      after: Line[];
    }
  /** The list: hold to unroll Athanasius's letter and watch 27 books fill the shelf; then three tests the churches used */
  | {
      kind: "hbibleList"; theme?: Theme; page?: Cue; before: Line[]; hold: string;
      books: string[]; letter: string;
      councils: { year: number; name: string }[];
      tests: { name: string; body: string }[];
      notes: HistNote[]; after: Line[];
    }
  /** Three shelves: the Old Testament as Protestant, Catholic and Orthodox Bibles hold it, side by side and fairly */
  | {
      kind: "hbibleShelves"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      traditions: { id: string; name: string; count: string; books: number; extra: string; say: string }[];
      note: HistNote; after: Line[];
    };
