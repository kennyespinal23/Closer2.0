import type { Mood } from "../../page/states";
import type { Cue, Line, Theme, Verse } from "../types";

/* What’s Been on Your Heart Lately?: this experience's own block kinds. Every kind here starts with "hlately".
   A conversation, not a survey: you set down what you're carrying, one stone at a time, and Page answers each one.
   Nothing is scored. Nothing is kept unless you say yes to keeping it. */

/** something you might be carrying. "heavy" things are handed over, "joy" things are thanked for, "open" things are
    asked about; Page answers each one as you set it down */
export type Stone = {
  id: string;
  /** on the stone, in your voice: "Someone I love" */
  label: string;
  weight: "heavy" | "open" | "joy";
  /** Page, as you set it down (one or two short lines) */
  reply: string;
  mood?: Mood;
  /** how it reads inside the prayer: "the people I love" */
  pray: string;
  /** how Page names it another day: "someone you love" */
  said: string;
};

/** a reply to how things have been since last time */
export type Since = { text: string; reply: string; mood?: Mood };

export type Blocks =
  /** The opening. With nothing kept, Page simply asks. With an earlier reflection kept (here or in another
      Heart to Heart), Page remembers it gently first and asks how it has been, any answer welcome. */
  | {
      kind: "hlatelyOpen"; theme?: Theme; page?: Cue;
      display: { text: string; sub: string };
      fresh: Line[];
      /** what Page says when he remembers, by the earlier reflection's topic. {when} is "last week" and so on,
          {items} the things named then, {choice} the answer given then */
      back: Record<string, string>;
      /** said after remembering, before the choices */
      ask: string;
      since: Since[];
      /** then into today */
      today: Line[];
      reply: string;
    }
  /** The stones: tap a thing you're carrying to set it down in the basket (tap it again there to take it back).
      Name your own with "something else". "Nothing much" is a fine answer too. */
  | {
      kind: "hlatelyCarry"; theme?: Theme; page?: Cue;
      before: Line[]; hint: string;
      stones: Stone[];
      other: { label: string; ask: string; placeholder: string; reply: string; pray: string };
      none: { label: string; reply: string };
      max: number; full: string;
      basket: string;
      /** after setting things down: one line that answers the mix (heavy, joy, both) */
      after: { heavy: string; joy: string; both: string; open: string };
      done: string;
    }
  /** Scripture, chosen by what you set down. Heavy things: hold to hand the basket over (1 Peter 5:7), then
      Jesus' invitation. Joyful things: the day the Lord has made. Everyone: Paul's asking-with-thanking. */
  | {
      kind: "hlatelyWord"; theme?: Theme; page?: Cue;
      cast: { verse: Verse; before: Line[]; hold: string; after: Line[] };
      rest: { verse: Verse; lines: Line[] };
      joy: { verse: Verse; lines: Line[] };
      peace: { verse: Verse; lines: Line[] };
    }
  /** Bring it to God: pray a prayer made from what you set down, write a little more, or sit quietly. Then,
      separately, the choice to keep it, asked plainly every time. */
  | {
      kind: "hlatelyPray"; theme?: Theme; page?: Cue;
      lines: Line[];
      pray: { label: string; open: string; heavy: string; joy: string; named: string; nothing: string; close: string };
      write: { label: string; ask: string; placeholder: string };
      quiet: { label: string; say: string };
      keep: { ask: string; small: string; yes: string; no: string; kept: string; notKept: string; question: string; since: string };
    };
