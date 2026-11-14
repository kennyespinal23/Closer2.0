import type { Action, Anchor, Mood } from "../page/states";

/* The lesson format. A new Bible experience is a Lesson object made of these blocks:
   no new components needed. Page's look is named here (mood, act, at) and drawn in src/page. */

export type Theme = "forest" | "burgundy" | "night" | "cream" | "navy" | "teal" | "walnut" | "amethyst" | "wine" | "olive" | "rose" | "copper" | "sky" | "orchid" | "seaglass";

/** Testimonies keep three kinds of claim apart, and say which is which on screen */
export type Tag = "fact" | "own" | "account" | "legend" | "interpretation" | "disputed" | "text" | "context" | "reading";
export type Pronoun = "he" | "she" | "they";
const P: Record<Pronoun, { he: string; his: string }> = { he: { he: "he", his: "his" }, she: { he: "she", his: "her" }, they: { he: "they", his: "their" } };
/* Labels follow the person: "In her own words", "How he understood it" */
export const tagInfo = (tag: Tag, who: Pronoun = "he") => ({
  fact: { label: "Documented", color: "#F3E6D2" },
  own: { label: `In ${P[who].his} own words`, color: "#FFC72C" },
  account: { label: `From ${P[who].his} own telling`, color: "#FFDFA0" },
  legend: { label: "Later legend", color: "#FF9A8B" },
  interpretation: { label: `How ${P[who].he} understood it`, color: "#A8DCD2" },
  disputed: { label: "Historians differ", color: "#D3C2FF" },
  // the Gospel moments keep Scripture, its background, and readings of it apart
  text: { label: "In the text", color: "#FFC72C" },
  context: { label: "Historical context", color: "#F3E6D2" },
  reading: { label: "A common reading", color: "#A8DCD2" },
})[tag];

/** An image from the historical record: never invented, always credited */
export type Archival = { src: string; alt: string; credit: string };
/** A quotation from a person in history, with where it was published */
export type Quote = { text: string; source: string };
/** A source the lesson relies on */
export type Source = { title: string; publisher: string; url?: string };

/** What kind of misconception it is. Kept honest: a disputed reading is never presented as settled. */
export type MythType = "contradicts" | "misattributed" | "tradition" | "disputed";
export const MYTH_TYPES: Record<MythType, { label: string; means: string }> = {
  contradicts: { label: "Contradicts Scripture", means: "The Bible says something different." },
  misattributed: { label: "Popular saying, not a verse", means: "It sounds biblical, but the Bible doesn’t say it." },
  tradition: { label: "Tradition, not in the text", means: "A detail the Bible never actually gives." },
  disputed: { label: "Christians disagree", means: "Faithful readers land in different places on this one." },
};

/** Where Page is and how he feels when something starts */
export type Cue = { at?: Anchor; mood?: Mood; act?: Action; look?: number; open?: boolean };

/** One thing Page says. `show` names a piece of the block to reveal with this line. */
export type Line = Cue & { say: string; show?: string };

/** Scripture, word for word from the named translation */
export type Verse = { text: string; ref: string; translation: string };

/* ---------- Bible Mysteries: the case schema ----------
   Every clue says where it comes from and how strong it is, so the screens can keep what Scripture states,
   what history supports, what people infer and what nobody knows visibly apart. */

export type CaseStatus = "Unresolved" | "Partly resolved" | "Resolved";
/** Where a claim stands (EvidenceSorter's four bins) */
export type ClaimType = "scripture" | "historical" | "hypothesis" | "unknown";
export const CLAIM_TYPES: Record<ClaimType, { label: string; means: string }> = {
  scripture: { label: "Stated in Scripture", means: "The text says it in so many words." },
  historical: { label: "Supported by history", means: "Evidence outside the Bible backs it." },
  hypothesis: { label: "Interpretation or hypothesis", means: "A reasonable reading or guess, not stated." },
  unknown: { label: "Not established", means: "Nobody can show this either way." },
};
/** How much weight a clue or theory carries */
export type Strength = "stated" | "supported" | "inference" | "tradition" | "unverified";
export const STRENGTH: Record<Strength, { label: string; level: number }> = {
  stated: { label: "Stated in the text", level: 4 },
  supported: { label: "Supported by evidence", level: 3 },
  inference: { label: "Inference", level: 2 },
  tradition: { label: "Later tradition", level: 1 },
  unverified: { label: "Unverified claim", level: 0 },
};
/** What kind of source something comes from */
export type SourceKind = "scripture" | "tradition" | "archaeology" | "scholarship" | "modern";
export const SOURCE_KINDS: Record<SourceKind, string> = {
  scripture: "Biblical text", tradition: "Later tradition", archaeology: "Archaeological evidence", scholarship: "Scholarly inference", modern: "Modern speculation",
};
/** A piece of evidence you can open: a passage, or a described source outside the Bible */
export type Exhibit = { label: string; verses?: Verse[]; note?: string };
/** Drawn reconstructions the ArtifactInspector can show, by name */
export type Art = "ark";

/* ---------- Bible Books: the book schema ----------
   A book is data: its genre, the shape of its structure, its sections, themes and key passages. The screens draw
   whatever shape the genre needs, so a Psalm collection isn't forced into a story arc. Sections are teaching
   divisions, and say so; facts, traditions and scholars' views are labelled apart. */

/** A place in a book: chapter and verse */
export type Place = [number, number];
export type Genre = "gospel" | "narrative" | "law" | "poetry" | "wisdom" | "prophecy" | "letter" | "apocalyptic";
export const GENRES: Record<Genre, string> = {
  gospel: "Gospel", narrative: "Historical narrative", law: "Narrative and law", poetry: "Poetry and song",
  wisdom: "Wisdom", prophecy: "Prophecy", letter: "Letter", apocalyptic: "Apocalyptic prophecy",
};
/** How the structure is drawn: a story that moves, a collection of pieces, an argument that builds, a series of visions */
export type BookShape = "arc" | "collection" | "argument" | "visions";
export const SHAPES: Record<BookShape, { unit: string; plural: string }> = {
  arc: { unit: "movement", plural: "movements" }, collection: { unit: "collection", plural: "collections" },
  argument: { unit: "step", plural: "steps of the argument" }, visions: { unit: "vision", plural: "visions" },
};
/** Where a statement about a book comes from */
export type BookTag = "text" | "tradition" | "scholarship" | "overview" | "readings";
export const BOOK_TAGS: Record<BookTag, string> = { text: "In the text", tradition: "Early tradition", scholarship: "Scholars’ view", overview: "Overview", readings: "Ways it’s read" };

export type BookSection = {
  id: string; title: string; chapters: string; from: Place; to: Place;
  /** one line, for the map */
  gist: string;
  summary: string; event: { title: string; ref: string }; verse: Verse; role: string; say: string;
};
export type BookThread = { id: string; title: string; say: string; stops: { at: Place; label: string; note: string; verse: Verse }[] };
export type Book = {
  name: string; title: string; genre: Genre; shape: BookShape;
  /** the small line over the name on the cover: "The Gospel of", "The Book of", "The Letter to the" */
  kicker: string;
  /** what its parts are called, when not the shape's usual word: Ruth's "scenes" */
  unit?: { unit: string; plural: string };
  /** what its chapters are called: "psalms" (default "chapters") */
  chapterWord?: string;
  /** the label over each section's event (default by shape: "A key event", or "A passage to know") */
  eventLabel?: string;
  /** verses in each chapter, so places can be drawn to scale */
  chapterLengths: number[];
  sections: BookSection[];
  /** a note under the map: these divisions are ours, not the text's */
  divisions: string;
  threads: BookThread[];
  /** for a story: where it turns */
  pivot?: {
    from: Place; to: Place; ref: string; verses: Verse[]; why: string;
    /** what Page says as the marker crosses into each part */
    say: { before: string; at: string; after: string };
    before: { label: string; text: string }; after: { label: string; text: string };
    /** smaller moments that echo it, e.g. later predictions */
    echoes: { at: Place; ref: string }[];
    regions?: { from: Place; to: Place; label: string }[];
  };
  summary: { overview: string; keys: string[] };
};

/* ---------- Connections: Pull the Thread ----------
   Scripture fragments float on a plane; you pull a thread from one to discover the next. Every thread says what kind
   of connection it is, so a quotation, a link the writer makes himself, and a reader's thematic echo never blur. */

export type LinkKind = "quote" | "explicit" | "theme";
export const LINK_KINDS: Record<LinkKind, { label: string; means: string }> = {
  quote: { label: "Direct quotation", means: "One passage quotes the other’s words." },
  explicit: { label: "Named in the text", means: "The writer makes the connection in so many words." },
  theme: { label: "Thematic reading", means: "An echo many readers hear: an interpretation, not a quotation." },
};
/** A passage on the plane: shown as its marked phrase, opened to the whole verse */
export type Fragment = { id: string; title: string; verse: Verse; mark: string; at: [number, number] };
/** One thread, in the order it's discovered */
export type Strand = { from: string; to: string; kind: LinkKind; label: string; body: string; prompt: string; say: string };

/* ---------- Psalms & Emotions ----------
   A psalm is data: its verses (as poetry), and its own movements. Each movement names the interaction that suits it
   and the landscape it leaves behind. The landscape is the psalm's movement, never the reader's mood, and nothing
   forces a psalm into three stages or a happy ending. */

/** The landscape: how light, misty, rainy, clouded, starry and glowing the scene is (each 0 to 1) */
export type Scene = { light: number; mist: number; rain: number; cloud: number; stars: number; glow: number };
/** A phrase you can touch: it's named, explained, and nudges the landscape */
export type PsalmPhrase = { text: string; verse: number; name: string; note: string; scene?: Partial<Scene>; say?: string };
export type PsalmMovement = {
  id: string; name: string; from: number; to: number; summary: string;
  /** how you meet it: touch the words (landscape), carry the text on (transition), or find the hinge (shift) */
  interaction: "landscape" | "transition" | "shift";
  phrases: PsalmPhrase[];
  /** the scene when you arrive, and when you leave */
  start: Scene; end: Scene;
  /** for "shift": the hinge word, and pairs of language that change across the psalm */
  hinge?: { word: string; verse: number; note: string };
  pairs?: { before: { text: string; verse: number }; after: { text: string; verse: number }; note: string }[];
};
export type Psalm = { number: number; title: string; about: string; verses: Verse[]; movements: PsalmMovement[]; key: Verse };

export type Block =
  /** Page talks. The last line's button is `reply`. */
  | {
      kind: "dialogue"; theme?: Theme; page?: Cue; lines: Line[]; reply?: string;
      display?: { text: string; sub?: string };
      /** a historical portrait shown with the last line (HistoricalPortrait) */
      portrait?: Archival & { name: string; dates: string };
    }
  /** A life on a line: tap each milestone to open it. Phases colour the dots; a span can be measured
      at the end ("40 years"). A note can set context first. */
  | {
      kind: "timeline"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      note?: { title: string; text: string };
      phases?: { id: string; label: string; color: string }[];
      events: { year: string; title: string; body: string; tag: Tag; say?: string; phase?: string; quote?: Quote }[];
      span?: { from: number; to: number; label: string };
      after: Line[];
    }
  /** A turning point told in a few documented moments, with an atmosphere to match (sound off by default) */
  | {
      kind: "turning"; theme?: Theme; page?: Cue; scene: "storm" | "still";
      beats: (Line & { text: string; tag: Tag; when?: string; quote?: Quote; verse?: Verse; intensity: number })[];
      after: Line[];
    }
  /** A real document: open it, look closer, read the transcription, then sort fact from legend */
  | {
      kind: "artifact"; theme?: Theme; page?: Cue; before: Line[];
      title: string; date: string; image: Archival; focus: { x: number; y: number; scale: number };
      transcription?: Quote; notes: { tag: Tag; text: string }[]; after: Line[];
    }
  /** Then and later, side by side; a closing note says what the change did and didn't undo */
  | {
      kind: "legacy"; theme?: Theme; page?: Cue; before: Line[];
      then: { label: string; items: string[] }; later: { label: string; items: string[] };
      quote?: Quote; note: string; after: Line[];
    }
  /** Scripture to read at your own pace. Page steps back to a corner; nothing moves on until you say so. */
  | { kind: "read"; theme?: Theme; page?: Cue; verse: Verse; reply?: string; label?: string; lead?: Line[] }
  /** The claim under investigation: Page voices it, it lands on a card, and you say what you think.
      Every answer moves on to the investigation. */
  | { kind: "claim"; theme?: Theme; page?: Cue; lines: Line[]; claim: string; options: { text: string; reply: string; mood?: Mood; act?: Action }[] }
  /** The verdict: Page flies along the claim and crosses it out, line by line; then what kind of
      misconception it was (show "type") and what Scripture shows (show "truth"). */
  /** Big Questions: several perspectives, each a card you open for a short explanation and a verse.
      Once all are open, a caveat says plainly what they don't settle. */
  | {
      kind: "perspectives"; theme?: Theme; page?: Cue; before: Line[];
      cards: { title: string; body: string; say: string; verse: Verse }[];
      caveat: string; after: Line[];
    }
  /** What we can know and what we can't: tiles you turn over, in two groups */
  | {
      kind: "knowns"; theme?: Theme; page?: Cue; before: Line[];
      known: { label: string; items: { text: string; ref: string }[] };
      unknown: { label: string; items: { text: string; ref: string }[] };
      after: Line[];
    }
  /** A conversation from Scripture, revealed one quoted line at a time. Page only comments between the lines;
      every spoken line is Scripture, with its speaker named. */
  | {
      kind: "exchange"; theme?: Theme; page?: Cue; before: Line[];
      lines: (Verse & { who: string; side?: "left" | "right"; say?: string; mood?: Mood; act?: Action })[];
      after: Line[];
    }
  /** A conversation you take part in. Nodes branch on your choices; a node with no choices ends it.
      `remember` stores your first choice by name; a replay (`replay`) shows what you said before. */
  | {
      kind: "scenario"; theme?: Theme; page?: Cue; before?: Line[];
      person: { name: string; role?: string };
      start: string;
      nodes: Record<string, { says: string; tone?: "warm" | "neutral" | "awkward" | "hurt"; choices?: { text: string; to: string; page?: Cue }[] }>;
      remember?: string; replay?: string; replayLabel?: string; after?: Line[];
    }
  /** How would you feel? Pick as many as are true. Every answer is met, none is graded. */
  | { kind: "feelings"; theme?: Theme; page?: Cue; before?: Line[]; prompt: string; options: { text: string; reply: string }[]; many: string; after?: Line[] }
  /** Two true things you might think you must choose between: bring them together into one */
  | { kind: "both"; theme?: Theme; page?: Cue; before: Line[]; a: string; b: string; joined: string; prompt: string; after: Line[] }
  /** PrayerPromptCards: what would you like to talk to God about? Remembered by `key` for later blocks. */
  | { kind: "topic"; theme?: Theme; page?: Cue; before?: Line[]; prompt: string; key: string; options: { id: string; text: string; reply: string }[] }
  /** PrayerBuilder: optional starter phrases (chosen by the remembered topic) that drop into a box you can edit
      freely or ignore. Kept in memory for this lesson only, under `save`. */
  | { kind: "builder"; theme?: Theme; page?: Cue; before?: Line[]; topicKey?: string; save: string; prompts: Record<string, string[]>; fallback: string[]; placeholder: string; label: string }
  /** StillnessMoment: press (or tap) a calm surface to enter a slow, quiet moment. Skippable, no timer. */
  | { kind: "still"; theme?: Theme; page?: Cue; before?: Line[]; invite: string; text: string; verse?: Verse; after?: Line[] }
  /** ScripturePrayer: pick a phrase from a passage; see a prayer prompt inspired by it, kept apart from the text */
  | { kind: "scripturePrayer"; theme?: Theme; page?: Cue; before?: Line[]; verse: Verse; phrases: { phrase: string; prompt: string }[]; after?: Line[] }
  /** PrayerRelease: your prayer on a card; swipe it up (or press the button) to close the moment. Nothing is sent. */
  | { kind: "release"; theme?: Theme; page?: Cue; before?: Line[]; from: string; fallback: string; ref: string; after?: Line[] }
  /** CaseFileOpening: a closed file; Page sets up the mystery, you open it, the title lands */
  | { kind: "caseOpen"; theme?: Theme; page?: Cue; before: Line[]; title: string; refs: string[]; open: string; after: Line[] }
  /** ArtifactInspector: a labelled reconstruction under a magnifying lens; features open as you find them */
  | {
      kind: "inspect"; theme?: Theme; page?: Cue; before: Line[]; art: Art; label: string; caption: string; hint: string;
      features: { id: string; name: string; x: number; y: number; body: string; verse: Verse; say: string; note?: string }[];
      after: Line[];
    }
  /** CaseTimeline: evidence cards you place in the order you think they happened; then the dates settle it */
  | {
      kind: "caseTimeline"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      cards: { id: string; when: string; title: string; body: string; basis: "stated" | "inference"; exhibit: Exhibit }[];
      inOrder: string; outOfOrder: string; after: Line[];
    }
  /** EvidenceBoard: pin clues, run a thread between two, and hear what the link does (and doesn't) show */
  | {
      kind: "board"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      clues: { id: string; title: string; ref: string; exhibit: Exhibit }[];
      links: { a: string; b: string; label: string; strength: Strength; say: string; body: string }[];
      noLink: string; after: Line[];
    }
  /** EvidenceSorter: a claim at a time; open its source, then say where it stands. Every answer is explained. */
  | {
      kind: "sorter"; theme?: Theme; page?: Cue; before: Line[];
      claims: { text: string; fits: ClaimType[]; why: string; exhibit: Exhibit }[];
      after: Line[];
    }
  /** TheoryExplorer: proposals about what happened, each labelled by where it comes from and how strong it is */
  | {
      kind: "theories"; theme?: Theme; page?: Cue; before: Line[];
      theories: { title: string; kind: SourceKind; strength: Strength; origin: string; body: string; against: string; say: string }[];
      caveat: string; after: Line[];
    }
  /** CaseReconstruction: rebuild the case from established evidence; the gaps stay visibly empty */
  | {
      kind: "reconstruct"; theme?: Theme; page?: Cue; before: Line[]; hint: string;
      slots: ({ id: string; when: string; text: string; ref: string } | { gap: string; say: string })[];
      /** a theory you may pin beside a gap: never into it */
      theory?: { text: string; say: string };
      after: Line[];
    }
  /** CaseReport: what Scripture tells us, what remains uncertain, what people have proposed; then the file closes */
  | {
      kind: "report"; theme?: Theme; page?: Cue; title: string;
      scripture: string[]; uncertain: string[]; proposed: string[]; note: string;
      refs: string[]; sources: Source[]; button: string;
    }
  /** BookOverviewExperience: the closed book; open it with a tap or a swipe */
  | { kind: "bookCover"; theme?: Theme; page?: Cue; before: Line[]; open: string; after: Line[] }
  /** The big picture: what kind of book, who and when, each fact labelled by where it comes from */
  | { kind: "bookFacts"; theme?: Theme; page?: Cue; before: Line[]; facts: { title: string; tag: BookTag; body: string; verse?: Verse; say: string }[]; after: Line[] }
  /** BookUnfolder: the book opens into a map of its sections, drawn to its shape */
  | { kind: "unfold"; theme?: Theme; page?: Cue; before: Line[]; hint: string; after: Line[] }
  /** BookArchitecture: each section opens to its summary, an event, a passage and its part in the whole */
  | { kind: "architecture"; theme?: Theme; page?: Cue; before: Line[]; hint: string; after: Line[] }
  /** NarrativeTurningPoint: slide a marker through the book and watch the story shift */
  | { kind: "pivot"; theme?: Theme; page?: Cue; before: Line[]; hint: string; after: Line[] }
  /** ThemeThreads: pick a theme and follow it through the book, passage by passage */
  | { kind: "threads"; theme?: Theme; page?: Cue; before: Line[]; hint: string; after: Line[] }
  /** A textual question, told plainly: what the manuscripts show, side by side */
  | {
      kind: "textual"; theme?: Theme; page?: Cue; before: Line[]; passage: Verse[];
      views: { label: string; ends: string; note: string }[]; body: string[]; after: Line[];
    }
  /** BookSummaryCard: the whole book folded into one card, kept in your library */
  | { kind: "bookSummary"; theme?: Theme; page?: Cue; say: string; button: string }
  /** Pull the Thread: drag threads between fragments to build a network, then see the whole pattern */
  | {
      kind: "pull"; theme?: Theme; page?: Cue; before: Line[]; size: [number, number];
      fragments: Fragment[]; strands: Strand[]; pattern: { title: string; body: string; say: string }; after: Line[];
    }
  /** EmotionEntrance: an optional "how are you?"; nothing is saved, and every answer leads to today's psalm */
  | { kind: "entrance"; theme?: Theme; page?: Cue; prompt: string; options: { text: string; reply: string }[]; skip: string; notice: string }
  /** Meet the psalm: Page's lines, then its opening verses */
  | { kind: "psalmMeet"; theme?: Theme; page?: Cue; before: Line[]; show: [number, number]; after: Line[] }
  /** One movement of the psalm, met through its own interaction */
  | { kind: "movement"; theme?: Theme; page?: Cue; movement: string; before: Line[]; hint: string; ask?: { question: string; stay: string }; after: Line[] }
  /** PsalmEmotionalArc: every movement together in one landscape */
  | { kind: "arc"; theme?: Theme; page?: Cue; before: Line[]; after: Line[] }
  /** QuietReflection: a line to take with you, then read again, be quiet, or finish */
  | { kind: "quiet"; theme?: Theme; page?: Cue; reflection: string; stay: string }
  /** PsalmSummary: Page beside the open psalm */
  | { kind: "psalmSummary"; theme?: Theme; page?: Cue; say: string; coming: string; button: string }
  | { kind: "correct"; theme?: Theme; page?: Cue; claim: string; before: Line[]; action: string; after: Line[]; truth: string; type: MythType }
  /** A real question. Every answer gets its own thoughtful reply (and Page's own mood), then Page explains,
      and a two-row comparison can make the distinction visible (show "compare"). */
  | {
      kind: "ask"; theme?: Theme; page?: Cue; prompt: string;
      options: { text: string; reply: string; mood?: Mood; act?: Action }[];
      after: Line[]; compare?: { not: { label: string; text: string }; but: { label: string; text: string } };
    }
  /** The verses around the verse. Tap the marked phrases to see what Paul is weighing;
      a balance tips when you've seen both. Lines can show "more" for a further verse. */
  | {
      kind: "context"; theme?: Theme; page?: Cue; before: Line[]; verse: Verse; hint: string;
      links: { phrase: string; label: string; note: string }[]; after: Line[]; more?: Verse;
      /** balance: the second side outweighs the first. shift: from the first to the second. pair: two clues side by side. */
      visual?: "balance" | "shift" | "pair" | "steps" | "none";
    }
  /** Two statements: the wrong one is struck out, and you drag (or tap) the right one into place.
      Lines can show "takeaway". */
  | { kind: "assemble"; theme?: Theme; page?: Cue; before: Line[]; not: string; but: string; prompt: string; after: Line[]; takeaway: string }
  /** A quiet question. Writing is optional and stays on this device. */
  | {
      kind: "journal"; theme?: Theme; page?: Cue; lines: Line[]; ref: string; write: string; skip: string; placeholder: string;
      /** said while you sit quietly; leave it empty and "skip" just moves on */
      quiet: string;
      /** the question over the writing box (default: Page's last line) */
      ask?: string;
      /** first, a quick check-in where every answer is fine */
      check?: { prompt: string; options: { text: string; reply: string; mood?: Mood; act?: Action }[] };
      /** a short prayer to pray, offered alongside writing (written for the app, not Scripture) */
      prayer?: { label: string; text: string };
    }
  /** Someone from the story steps forward. Lines reveal "companions" and "note" by name. */
  | {
      kind: "character"; theme?: Theme; page?: Cue; lines: Line[]; reply?: string;
      name: string; place: string; figure: Figure; companions?: { name: string; figure: Figure }[];
      note?: Verse;
    }
  /** The story told beat by beat: Page's line, a card of Scripture, sometimes something to do */
  | { kind: "story"; theme?: Theme; page?: Cue; beats: Beat[] }
  /** A verse to read slowly and highlight with a finger */
  | {
      kind: "highlight"; theme?: Theme; page?: Cue; verse: Verse; context?: Verse;
      /** Only these words of the verse need highlighting (the rest is there to read). Page flies over to them. */
      target?: string;
      before: Line[]; prompt: string; after: Line[]; reply?: string;
    }
  /** Something hidden comes into view: a stone rolled back, a figure stepping out */
  | {
      kind: "reveal"; theme?: Theme; page?: Cue; scene: "tomb";
      /** before: lines up to the stone; show "command" to put the command on screen */
      before: Line[]; command: Verse; drag: string;
      /** after the stone: show "call" for the call, "out" when the figure steps out, "outcome" for its verse */
      after: Line[]; call: Verse; outcome: Verse; reply?: string;
    }
  /** A light check that the story landed. Never graded harshly. */
  | { kind: "question"; theme?: Theme; page?: Cue; prompt: string; options: { text: string; correct?: boolean; reply: string }[] }
  /** An open question with no right answer. Page responds to whatever you pick. */
  | { kind: "reflection"; theme?: Theme; page?: Cue; prompt: string; options: { text: string; reply: string }[] }
  /** A verse to carry out of the lesson */
  | { kind: "verse"; theme?: Theme; page?: Cue; before: Line[]; verse: Verse; after: Line[]; reply?: string }
  | {
      kind: "complete"; theme?: Theme; page?: Cue; title: string; body: string; keep?: Verse;
      /** A calm ending for studies: what you found, the verse itself, no burst */
      calm?: boolean; summary?: string[]; verse?: Verse; button?: string;
      /** A misconception's ending: the claim and what Scripture shows, side by side, with the references */
      myth?: { claim: string; truth: string; refs: string[]; type: MythType };
      /** passages to look up, listed under a calm ending */
      refs?: string[];
      /** a related passage, kept visibly separate from the history (testimonies) */
      scripture?: Verse & { label: string };
      /** what the lesson rests on */
      sources?: Source[];
      /** where to go deeper next: other lessons, opened straight from here */
      related?: { title: string; sub: string; lessonId: string }[];
    };

export type Beat = Line & {
  card?: { text: string; ref?: string; translation?: string; big?: boolean };
  /** "send": flick the card up and away. "hold": press and hold while a count runs. */
  task?: { type: "send"; label: string } | { type: "hold"; label: string; unit: string; from: number; to: number; caption?: string };
};

export type Figure = "man" | "woman" | "woman2";

export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  kind: "Character study" | "Verse study" | "Bible story" | "Misconception" | "Big question" | "Testimony" | "Jesus only" | "Everyday faith" | "Learning to pray" | "Bible mystery" | "Book overview" | "Connection" | "Psalm";
  scripture: string;
  minutes: number;
  theme: Theme;
  /** what a lesson rests on: required for testimonies (and permission, for living people) */
  sources?: Source[];
  /** for testimonies: how to refer to the person in labels */
  pronoun?: Pronoun;
  /** for Bible Mysteries: the case number and where the case stands */
  case?: { id: string; status: CaseStatus };
  /** for Bible Books: the book itself, which every book block reads */
  book?: Book;
  /** for Psalms & Emotions: the psalm itself, which every psalm block reads */
  psalm?: Psalm;
  blocks: Block[];
};
