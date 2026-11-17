import type { Cue, Line, Theme, Verse } from "../types";

/* Why Did Jesus Have to Die?: this experience's own block kinds. Every kind here starts with "atone". */

/** A station on the path of redemption. "before" stations are the patterns and promises; "jesus" stations echo them. */
export type AtoneStation = {
  id: string; era: "before" | "jesus"; label: string; book: string;
  icon: "door" | "veil" | "servant" | "river" | "cup" | "cross";
  verse: Verse; say: string;
};

export type Blocks =
  /** The path of redemption: walk the stations in order, then pull a thread from each moment in Jesus' life back to
      the earlier station it echoes. `mark` names the matching words in each station's verse. Once all are linked,
      `wow` lands. */
  | {
      kind: "atonePath"; theme?: Theme; page?: Cue; before: Line[]; walkHint: string; linkHint: string;
      stations: AtoneStation[];
      links: { from: string; to: string; mark: [string, string]; why: string; extra?: Verse; say: string }[];
      wrong: string;
      wow: { title: string; verse: Verse; say: string };
      after: Line[];
    }
  /** The gap: try to cross it from our side (each attempt falls short), then watch the bridge come from God's side */
  | {
      kind: "atoneBridge"; theme?: Theme; page?: Cue; before: Line[]; tryHint: string;
      attempts: { label: string; say: string }[];
      short: Verse; turn: string;
      planks: { label: string; verse: Verse; say: string }[];
      after: Line[];
    }
  /** Lenses on the cross: six ways Christians have described what it did, each lit from the centre when you tap it */
  | {
      kind: "atoneLenses"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      lenses: { name: string; image: string; body: string; verse: Verse; held: string; say: string }[];
      caveat: string;
      after: Line[];
    };
