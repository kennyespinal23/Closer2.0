import type { Block, Book, Lesson } from "./types";

/* BookOverviewExperience: builds a Bible Books lesson from a book's data and Page's lines for each scene.
   The book decides the shape: a story gets the turning point; a collection, an argument or a series of visions
   skips it, and a book with no textual question skips that scene. Nothing here is specific to Mark. */

type Scene<K extends Block["kind"]> = Omit<Extract<Block, { kind: K }>, "kind">;

export type BookScript = {
  id: string; title: string; subtitle: string; scripture: string; minutes: number;
  cover: Scene<"bookCover">;
  facts: Scene<"bookFacts">;
  unfold: Scene<"unfold">;
  architecture: Scene<"architecture">;
  pivot?: Scene<"pivot">;
  threads: Scene<"threads">;
  textual?: Scene<"textual">;
  summary: Scene<"bookSummary">;
};

export function BookOverviewExperience(book: Book, s: BookScript): Lesson {
  const blocks: Block[] = [
    { kind: "bookCover", page: { at: "top", act: "enter", mood: "excited" }, ...s.cover },
    { kind: "bookFacts", page: { at: "top", mood: "curious" }, ...s.facts },
    { kind: "unfold", page: { at: "top", mood: "excited" }, ...s.unfold },
    { kind: "architecture", page: { at: "top", mood: "curious" }, ...s.architecture },
  ];
  // only a story has a turning point to find
  if (book.shape === "arc" && book.pivot && s.pivot) blocks.push({ kind: "pivot", page: { at: "top", mood: "curious" }, ...s.pivot });
  blocks.push({ kind: "threads", page: { at: "top", mood: "thinking" }, ...s.threads });
  if (s.textual) blocks.push({ kind: "textual", page: { at: "top", mood: "thinking" }, ...s.textual });
  blocks.push({ kind: "bookSummary", page: { at: "corner", mood: "happy" }, ...s.summary });
  return {
    id: s.id, title: s.title, subtitle: s.subtitle, kind: "Book overview", scripture: s.scripture,
    minutes: s.minutes, theme: "sky", book, blocks,
  };
}
