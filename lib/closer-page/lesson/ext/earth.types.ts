import type { Cue, Finding, Line, Theme, Verse } from "../types";

/* How Old Is the Earth?: this experience's own block kinds. Every kind here starts with "earth". */

export type Fossil = "trilobite" | "fish" | "fern" | "ammonite" | "tooth";
export type Lens = "yec" | "dayage" | "gap" | "framework" | "analogical" | "temple";

export type Blocks =
  /** RockLayers: a cliff of layers. First guess which formed first; then dig up from the bottom, one layer at a time,
      and each gives up its fossil. Layers are listed top to bottom. */
  | {
      kind: "earthStrata"; theme?: Theme; page?: Cue; before: Line[]; guess: string; right: string; wrong: string; hint: string;
      layers: { name: string; era: string; fossil: Fossil; fossilName: string; color: string; say: string }[];
      note: string; findings: Finding[]; after: Line[];
    }
  /** DecayClock: a grid of parent atoms. Let time pass a quarter half-life at a time, then match a sample's ratio. */
  | {
      kind: "earthDecay"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      parent: string; daughter: string; halfLife: number; sample: { name: string; left: number };
      notYet: string; match: string; note: string; findings: Finding[]; after: Line[];
    }
  /** IndependentClocks: specimens from four places; each drops its age onto one ruler, and they cluster */
  | {
      kind: "earthClocks"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      clocks: { id: "meteor" | "moon" | "zircon" | "rock"; name: string; what: string; age: number; plus: number; say: string }[];
      best: { age: number; plus: number; label: string };
      findings: Finding[]; after: Line[];
    }
  /** DeepTimeExplorer: Earth's whole history on one strip. Zoom (buttons, chips, or pinch) from 4.54 billion years
      down to recorded history; lines show "clock" to reveal history squeezed into one 24-hour day. */
  | {
      kind: "earthDeepTime"; theme?: Theme; page?: Cue; before: Line[]; hint: string; deepest: string;
      levels: { label: string; span: number }[];
      events: { ago: number; title: string; body: string }[];
      after: Line[];
    }
  /** GenesisLenses: Genesis 1's seven days as tiles; each lens rearranges them the way that reading sees them */
  | {
      kind: "earthReadings"; theme?: Theme; page?: Cue; before: Line[]; hint: string; verse: Verse;
      days: string[];
      lenses: { id: Lens; name: string; badge: string; claim: string; held: string; say: string }[];
      after: Line[];
    };
