import type { BookShape, Genre } from "../lesson/types";

/* Bible Books after Mark. Each was planned for its own genre and shape, so it gets the screens its kind of
   writing needs rather than Mark's story arc. The divisions noted here are common teaching outlines (or headings
   the text itself gives, where it says so), to be checked against the text when each book is written. */

export type BookPlan = {
  id: string; name: string; ref: string; genre: Genre; shape: BookShape;
  /** the structure the overview will draw */
  plan: string;
  /** how this book's overview should differ */
  design: string;
};

export const FUTURE_BOOKS: BookPlan[] = [
  { id: "genesis", name: "Genesis", ref: "Genesis 1–50", genre: "narrative", shape: "arc",
    plan: "Beginnings (1–11); Abraham (12–25); Isaac and Jacob (25–36); Joseph (37–50).",
    design: "Family-tree threads (the promise passed on); the text’s own repeated “These are the generations of…” as markers." },
  { id: "exodus", name: "Exodus", ref: "Exodus 1–40", genre: "law", shape: "arc",
    plan: "Out of Egypt (1–18); covenant at Sinai (19–24); the tabernacle (25–40), broken by the golden calf (32–34).",
    design: "A map journey for 1–18; law and tabernacle as building plans, not a plot." },
  { id: "ruth", name: "Ruth", ref: "Ruth 1–4", genre: "narrative", shape: "arc",
    plan: "Four chapters, four scenes: loss, gleaning, the threshing floor, redemption.",
    design: "Short enough to show every scene; one thread (kindness, Hebrew hesed) followed through all four." },
  { id: "psalms", name: "Psalms", ref: "Psalms 1–150", genre: "poetry", shape: "collection",
    plan: "Five books: 1–41, 42–72, 73–89, 90–106, 107–150, each ending in a short blessing.",
    design: "No story arc and no turning point: a shelf of five collections, then kinds of psalm (lament, praise, thanks) as threads." },
  { id: "proverbs", name: "Proverbs", ref: "Proverbs 1–31", genre: "wisdom", shape: "collection",
    plan: "Collections the text labels itself: a father’s teaching (1–9), Solomon’s sayings (10:1), words of the wise (22:17), more of Solomon’s (25:1), Agur (30:1), Lemuel (31:1).",
    design: "Collections, not chapters; threads by topic (words, work, money, friendship)." },
  { id: "isaiah", name: "Isaiah", ref: "Isaiah 1–66", genre: "prophecy", shape: "collection",
    plan: "Often read in three parts: 1–39, 40–55, 56–66. Who wrote which parts, and when, is debated, and the overview must say so.",
    design: "Judgment and comfort as two threads; the servant passages as stops." },
  { id: "luke", name: "Luke", ref: "Luke 1–24", genre: "gospel", shape: "arc",
    plan: "Birth and beginnings (1–4); Galilee (4–9); the journey to Jerusalem (9:51–19:27); Jerusalem (19–24).",
    design: "The turning point is 9:51, “he intently set his face to go to Jerusalem” (WEB); outsiders welcomed as a thread." },
  { id: "john", name: "John", ref: "John 1–21", genre: "gospel", shape: "arc",
    plan: "Prologue (1:1–18); the signs (1:19–12:50); the farewell and the cross (13–20); epilogue (21).",
    design: "The book states its own purpose (20:30–31); signs as stops; a textual note on 7:53–8:11." },
  { id: "romans", name: "Romans", ref: "Romans 1–16", genre: "letter", shape: "argument",
    plan: "Often outlined as: all need grace (1–3); right with God by faith (3–5); new life (6–8); Israel (9–11); living it out (12–16).",
    design: "An argument that builds, drawn as steps; threads follow words like “righteousness” and “faith.”" },
  { id: "james", name: "James", ref: "James 1–5", genre: "letter", shape: "collection",
    plan: "Readers disagree on its outline; it reads like wisdom teaching on trials, words, faith and works, and wealth.",
    design: "Topics, not a sequence; say plainly that there’s no agreed outline." },
  { id: "revelation", name: "Revelation", ref: "Revelation 1–22", genre: "apocalyptic", shape: "visions",
    plan: "Vision of Jesus (1); letters to seven churches (2–3); the throne room (4–5); series of sevens (6–16); Babylon falls and all things new (17–22).",
    design: "Visions and symbols, not a timeline; Christians read it in several ways, and the overview shows them side by side." },
];
