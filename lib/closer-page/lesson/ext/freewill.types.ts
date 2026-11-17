import type { Cue, Line, Theme, Verse } from "../types";

/* If God Knows the Future, Do We Have Free Will?: this experience's own block kinds. Every kind here starts with
   "freewill". The branching story is data shared by the Choice Explorer and its replay: nodes are keyed by the path
   taken so far ("" is the start, "0" the first option, "01" first then second...), three decisions deep. */

export type FreeWillNode = { scene: string; options: [string, string]; replies: [string, string] };
export type FreeWillStory = { title: string; nodes: Record<string, FreeWillNode> };

export type FreeWillView = {
  id: "ordain" | "foresee" | "middle" | "timeless" | "open";
  /** the chip */
  name: string;
  /** the view in one or two plain sentences */
  claim: string;
  /** who holds it: people and traditions */
  who: string;
  /** the hardest question put to it */
  pushback: string;
  say: string;
  /** a minority view, flagged as such */
  minority?: boolean;
};

export type Blocks =
  /** The Choice Explorer: a branching weekend, drawn as a path that forks as you choose. The route is kept by `save`. */
  | { kind: "freewillPath"; theme?: Theme; page?: Cue; before: Line[]; story: FreeWillStory; save: string; after: Line[] }
  /** The replay: scrub back through the route you chose, then flip the arrow between knowing and causing */
  | {
      kind: "freewillReplay"; theme?: Theme; page?: Cue; before: Line[]; story: FreeWillStory; save: string;
      scrub: string; know: { label: string; say: string }; cause: { label: string; say: string }; after: Line[];
    }
  /** Two threads in Scripture: weigh each passage onto God's side or ours; then find both in one sentence */
  | {
      kind: "freewillBoth"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      sides: { god: string; human: string };
      cards: { verse: Verse; side: "god" | "human"; say: string }[];
      key: { verse: Verse; god: string; human: string; hint: string; say: string };
      after: Line[];
    }
  /** Five lenses on the same timeline: pick a view and watch how it pictures God, time and your choice */
  | { kind: "freewillViews"; theme?: Theme; page?: Cue; before: Line[]; hint: string; views: FreeWillView[]; caveat: string; after: Line[] }
  /** Why it matters: cards that turn over from a worry to what Christians hold */
  | {
      kind: "freewillStakes"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      cards: { title: string; worry: string; answer: string; ref: string; say: string }[];
      after: Line[];
    };
