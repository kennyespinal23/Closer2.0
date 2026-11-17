import type { Cue, Finding, LabTag, Line, Theme } from "../types";

/* Did Humans Really Evolve?: this experience's own block kinds. Every kind here starts with "evo". */

export type Blocks =
  /** The Tree of Life: four living apes at the tips. Try to make the chimpanzee our ancestor (`wrong` is said when it
      snaps back), then tap each glowing branch point to grow the tree down to a shared ancestor. */
  | {
      kind: "evoTree"; theme?: Theme; page?: Cue; before: Line[];
      dragHint: string; wrong: Line[]; hint: string;
      tips: { id: "orangutan" | "gorilla" | "chimp" | "human"; name: string }[];
      /** branch points, from the youngest down */
      nodes: { id: string; label: string; date: string; say: string }[];
      findings: Finding[]; after: Line[];
    }
  /** A dig down the human branch: newest rock on top. Dig each layer in turn to uncover what was found there. */
  | {
      kind: "evoDig"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      layers: { name: string; nick?: string; when: string; where: string; body: string; tag: LabTag; say: string }[];
      findings: Finding[]; after: Line[];
    }
  /** Genes: slide two chimp chromosomes together to match human chromosome 2, then scan two strands of DNA */
  | {
      kind: "evoGenes"; theme?: Theme; page?: Cue; before: Line[];
      joinHint: string; joined: Line[];
      scanHint: string; human: string; chimp: string; scanned: Line[];
      findings: Finding[]; after: Line[];
    }
  /** Voices at the table: Christian views on evolution and Genesis. Open each; then what they share appears. */
  | {
      kind: "evoViews"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      views: { name: string; who: string; science: string; genesis: string; adam: string; say: string }[];
      shared: { title: string; text: string }; note: string; after: Line[];
    };
