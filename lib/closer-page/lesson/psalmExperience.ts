import type { Block, Lesson, Psalm } from "./types";

/* PsalmExperience: builds a Psalms & Emotions lesson from a psalm and Page's lines. One block per movement, in the
   psalm's own order and number, so a psalm with two movements, or four, or one that ends in the dark, is built as it
   is. The entrance, the whole-psalm view, the quiet moment and the close are the same for every psalm. */

type Omitted<K extends Block["kind"]> = Omit<Extract<Block, { kind: K }>, "kind">;

export type PsalmScript = {
  id: string; title: string; subtitle: string; minutes: number;
  entrance: Omitted<"entrance">;
  meet: Omitted<"psalmMeet">;
  movements: Record<string, Omit<Omitted<"movement">, "movement">>;
  arc: Omitted<"arc">;
  quiet: Omitted<"quiet">;
  close: Omitted<"psalmSummary">;
};

export function PsalmExperience(psalm: Psalm, s: PsalmScript): Lesson {
  const blocks: Block[] = [
    { kind: "entrance", page: { at: "center", act: "enter", mood: "tender" }, ...s.entrance },
    { kind: "psalmMeet", page: { at: "top", mood: "tender" }, ...s.meet },
    ...psalm.movements.map(m => ({ kind: "movement" as const, page: { at: "top" as const, mood: "thinking" as const }, movement: m.id, ...s.movements[m.id] })),
    { kind: "arc", page: { at: "top", mood: "tender" }, ...s.arc },
    { kind: "quiet", page: { at: "top", mood: "tender", act: "settle" }, ...s.quiet },
    { kind: "psalmSummary", page: { at: "left", mood: "tender", act: "settle" }, ...s.close },
  ];
  return {
    id: s.id, title: s.title, subtitle: s.subtitle, kind: "Psalm", scripture: `Psalm ${psalm.number}`, minutes: s.minutes,
    theme: "seaglass", psalm, blocks,
  };
}
