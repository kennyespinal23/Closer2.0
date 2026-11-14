import type { Block, Lesson, Line, Verse } from "./types";

/* ConnectionsExperience: builds a Connections lesson from one network. Page sets it up, you pull the threads, and
   a calm ending says what the connection is. A new experience is just a new network. */

type Pull = Omit<Extract<Block, { kind: "pull" }>, "kind">;

export type ConnectionScript = {
  id: string; title: string; subtitle: string; scripture: string; minutes: number;
  intro: { lines: Line[]; display: { text: string; sub?: string }; reply: string };
  pull: Pull;
  end: { title: string; summary: string[]; verse: Verse; refs: string[] };
};

export function ConnectionsExperience(s: ConnectionScript): Lesson {
  return {
    id: s.id, title: s.title, subtitle: s.subtitle, kind: "Connection", scripture: s.scripture, minutes: s.minutes, theme: "orchid",
    blocks: [
      { kind: "dialogue", page: { at: "hero", act: "enter", mood: "curious" }, lines: s.intro.lines, display: s.intro.display, reply: s.intro.reply },
      { kind: "pull", page: { at: "left", mood: "curious" }, ...s.pull },
      {
        kind: "complete", page: { at: "top", mood: "happy", act: "hop" }, calm: true, title: s.end.title,
        body: "The Lord is always closer than you think.", summary: s.end.summary, verse: s.end.verse, refs: s.end.refs, button: "Finish",
      },
    ],
  };
}
