import type { Cue, Finding, LabTag, Line, Theme } from "../types";

/* Is the Universe Fine-Tuned for Life?: this experience's own block kinds. Every kind here starts with "tune". */

export type Blocks =
  /** The Universe Simulator: four simplified dials on a mixing desk, with a live, illustrative preview of what each
      setting would do to stars, elements, structure and chemistry. Turn every dial, then set it back to ours. */
  | { kind: "tuneDesk"; theme?: Theme; page?: Cue; before: Line[]; hint: string; reset: string; note: string; after: Line[] }
  /** Carbon's energy level: scan the energies like a radio dial; the trace shows where carbon is made, and peaks at
      the real level (about 7.65 MeV) */
  | { kind: "tuneCarbon"; theme?: Theme; page?: Cue; before: Line[]; hint: string; findings: Finding[]; after: Line[] }
  /** A number too big to picture: hold to add zeros, passing landmarks on the way */
  | {
      kind: "tuneZeros"; theme?: Theme; page?: Cue; before: Line[]; hold: string; to: number;
      marks: { power: number; label: string }[]; finding: Finding; after: Line[];
    }
  /** Four lenses on the same puzzle: look through each one, then the problem every lens shares appears */
  | {
      kind: "tuneLenses"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      lenses: { id: string; name: string; claim: string; support: string; objection: string; tag: LabTag; say: string }[];
      shared: { title: string; text: string; say: string };
      after: Line[];
    };
