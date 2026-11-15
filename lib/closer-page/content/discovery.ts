import type { Lesson } from "../lesson/types";
import { LESSONS } from "./index";
import { library } from "./library";

/* The Discovery Graph: hand-picked links between experiences that already exist, so finishing one can point to a
   good next step. It is not a category and not a feed. Every connection here was written and checked by hand
   against both lessons' own text; nothing is linked just because two lessons share a tag, and nothing is generated.

   How a link stands to Scripture is always said (`basis`), so a shared theme is never dressed up as a quotation:
   - "text": both lessons read the same passage, or one quotes the other's passage
   - "narrative": the same person or story, further along in the Bible's own account
   - "theme": a shared theme or image; the passages don't cite each other
   - "application": one way the first lesson's idea shows up in ordinary life, offered as an interpretation */

export type ConnectionType = "continue_story" | "go_deeper" | "bigger_picture" | "everyday_application";
export type ConnectionBasis = "text" | "narrative" | "theme" | "application";
export type EditorialStatus = "approved" | "draft" | "retired";
export type PublicationStatus = "published" | "planned";

export type Experience = {
  id: string;
  title: string;
  /** the Explore shelf it lives on (its category and colour) */
  categoryId: string;
  categoryLabel: string;
  scriptureReferences: string[];
  characters: string[];
  themes: string[];
  biblicalBooks: string[];
  /** minutes */
  estimatedDuration: number;
  publicationStatus: PublicationStatus;
};

export type Connection = {
  sourceExperienceId: string;
  targetExperienceId: string;
  type: ConnectionType;
  basis: ConnectionBasis;
  /** one sentence: why this one, and how the two really relate */
  explanation: string;
  /** a short curiosity line, a question or a half-told thing; never a claim the text doesn't make */
  curiosityHook: string;
  /** 1 is the strongest link from its source */
  priority: 1 | 2 | 3;
  editorialStatus: EditorialStatus;
};

export const CONNECTION_TYPES: Record<ConnectionType, { label: string; page: string }> = {
  continue_story: { label: "Continue the story", page: "There’s more to this story." },
  go_deeper: { label: "Go deeper", page: "Want to see where this leads?" },
  bigger_picture: { label: "Bigger picture", page: "That reminds me of something." },
  everyday_application: { label: "Everyday application", page: "This one shows up in real life." },
};

export const BASIS: Record<ConnectionBasis, string> = {
  text: "Same passage",
  narrative: "Later in the story",
  theme: "A shared theme",
  application: "One way to live it",
};

/* Lessons that aren't published yet but have a link waiting for them. A link to one stays hidden until the lesson
   ships: the John 21 restoration is the natural next step after Peter sinks, so it's written now. */
const PLANNED: Record<string, { title: string; categoryId: string; scripture: string; minutes: number }> = {
  "jesus-restores-peter": { title: "Jesus Restores Peter", categoryId: "jesus", scripture: "John 21:15–19", minutes: 5 },
};

/* Two lessons on one story from different shelves: never recommend one after the other */
const RETELLINGS: [string, string][] = [["zacchaeus", "jesus-zacchaeus"], ["lazarus", "jesus-wept"], ["storm", "jesus-storm"]];

/* Who and what each linked lesson is about (the rest of an Experience comes from the lesson itself) */
const ABOUT: Record<string, { characters?: string[]; themes: string[] }> = {
  "jesus-peter-sank": { characters: ["Jesus", "Peter"], themes: ["faith", "fear", "rescue"] },
  "jesus-storm": { characters: ["Jesus", "the disciples"], themes: ["fear", "who Jesus is"] },
  "forgive-anyone": { characters: ["Paul", "Peter", "the thief on the cross"], themes: ["forgiveness", "second chances"] },
  "book-mark": { characters: ["Jesus"], themes: ["who Jesus is"] },
  "god-far-away": { characters: ["David", "Jesus"], themes: ["lament", "God’s presence"] },
  "psalm-13": { characters: ["David"], themes: ["lament", "trust"] },
  "pray-angry": { themes: ["lament", "honest prayer"] },
  "three-wise-men": { characters: ["the magi"], themes: ["tradition vs text"] },
  "mystery-star": { characters: ["the magi", "Herod"], themes: ["the nativity"] },
  "apple": { characters: ["Adam", "Eve"], themes: ["tradition vs text", "trust"] },
  "mystery-eden": { characters: ["Adam", "Eve"], themes: ["Eden"] },
  "mystery-thorn": { characters: ["Paul"], themes: ["weakness", "prayer"] },
  "unanswered-prayer": { characters: ["Paul", "Jesus"], themes: ["prayer", "trust"] },
  "lost-sheep": { characters: ["Jesus"], themes: ["the shepherd", "the lost"] },
  "connect-shepherd": { characters: ["David", "Ezekiel", "Jesus"], themes: ["the shepherd"] },
  "corrie-ten-boom": { characters: ["Corrie ten Boom"], themes: ["forgiveness"] },
  "everyday-apology": { themes: ["forgiveness", "pride"] },
  "brother-lawrence": { characters: ["Brother Lawrence"], themes: ["ordinary work", "God’s presence"] },
  "everyday-noticed": { themes: ["serving quietly"] },
  "jesus-washed-feet": { characters: ["Jesus", "Peter"], themes: ["serving"] },
  "ruth": { characters: ["Ruth", "Naomi"], themes: ["loyalty", "grief"] },
  "book-ruth": { characters: ["Ruth", "Naomi", "Boaz"], themes: ["loyalty", "redemption"] },
  "connect-bread": { characters: ["Moses", "Jesus"], themes: ["provision", "bread"] },
  "connect-lamb": { characters: ["Moses", "Jesus"], themes: ["Passover", "sacrifice"] },
  "book-john": { characters: ["Jesus"], themes: ["signs", "belief"] },
  "jesus-well": { characters: ["Jesus", "the Samaritan woman"], themes: ["belonging"] },
  "psalm-51": { characters: ["David"], themes: ["confession"] },
  "pray-forgive": { themes: ["confession", "forgiveness"] },
  "more-than-you-can-handle": { characters: ["Paul"], themes: ["suffering", "tradition vs text"] },
  "romans-8-28": { characters: ["Paul"], themes: ["suffering", "hope"] },
  "why-suffering": { characters: ["Job", "Jesus"], themes: ["suffering"] },
  "jesus-wept": { characters: ["Jesus", "Mary", "Martha", "Lazarus"], themes: ["grief"] },
  "everyday-promotion": { themes: ["jealousy"] },
  "everyday-ahead": { themes: ["comparison", "contentment"] },
  "john-newton": { characters: ["John Newton"], themes: ["forgiveness", "grace"] },
};

const c = (s: string, t: string, type: ConnectionType, basis: ConnectionBasis, priority: 1 | 2 | 3, curiosityHook: string, explanation: string, editorialStatus: EditorialStatus = "approved"): Connection =>
  ({ sourceExperienceId: s, targetExperienceId: t, type, basis, priority, curiosityHook, explanation, editorialStatus });

/* The curated links. Read both lessons before adding one, and say how they really relate. */
export const CONNECTIONS: Connection[] = [
  // Peter
  c("jesus-peter-sank", "jesus-restores-peter", "continue_story", "narrative", 1,
    "Peter’s story didn’t end on the water. What happened after he denied Jesus?",
    "Peter sinks here and later denies Jesus three times. In John 21 Jesus asks him three times if he loves him."),
  c("jesus-peter-sank", "forgive-anyone", "continue_story", "narrative", 1,
    "Peter’s story didn’t end on the water. What happened after he denied Jesus?",
    "Peter later denies Jesus three times. This question follows him to John 21, where Jesus asks him three times if he loves him and gives him work to do."),
  c("jesus-peter-sank", "jesus-storm", "go_deeper", "theme", 2,
    "It wasn’t the first storm on that lake.",
    "Two different nights at sea. In Mark 4 the disciples ask “Who then is this?”; in Matthew 14 they worship him as the Son of God."),
  c("jesus-storm", "jesus-peter-sank", "continue_story", "narrative", 1,
    "Another night, another storm. This time someone gets out of the boat.",
    "Later in the Gospels the disciples are on the same lake in the wind again, and Peter walks toward Jesus on the water (Matthew 14)."),
  c("jesus-storm", "book-mark", "bigger_picture", "text", 2,
    "“Who then is this?” Mark keeps asking it.",
    "The storm is Mark 4:35–41. See where it sits in the whole Gospel, and how often Mark raises the same question."),
  c("book-mark", "jesus-storm", "go_deeper", "text", 1,
    "You flew past the storm. Want to sit in the boat?",
    "Mark 4:35–41 was one stop in the overview. This one stays with that single scene, line by line."),

  // Psalm 13 and honest prayer
  c("god-far-away", "psalm-13", "go_deeper", "text", 1,
    "You heard “How long?” Psalm 13 doesn’t stop there.",
    "This question quoted Psalm 13:1. Here is the whole psalm, all six verses, from “How long?” to singing."),
  c("psalm-13", "pray-angry", "everyday_application", "text", 1,
    "David said the hard thing out loud. Could you?",
    "This prayer lesson is built on Psalm 13 too, and helps you put your own frustration into words to God."),
  c("psalm-13", "god-far-away", "bigger_picture", "text", 2,
    "Why does God feel far away sometimes?",
    "A Big Question that starts from this same psalm and looks at several honest answers."),
  c("pray-angry", "psalm-13", "go_deeper", "text", 1,
    "Want to read the whole psalm you just prayed from?",
    "This lesson drew on Psalm 13. Read all six verses slowly and watch where David ends up."),

  // Matthew 2
  c("three-wise-men", "mystery-star", "go_deeper", "text", 1,
    "Matthew doesn’t count the visitors. He does mention a star.",
    "The same passage, Matthew 2:1–12, opened as a case: what the star might have been, and what nobody knows."),
  c("mystery-star", "three-wise-men", "go_deeper", "text", 1,
    "The star is a mystery. “Three wise men” is something else.",
    "Same passage again. Check what Matthew says, and doesn’t say, about how many came."),

  // Genesis 2–3
  c("apple", "mystery-eden", "go_deeper", "text", 1,
    "The fruit has no name. Does the garden have an address?",
    "Genesis 2:8–14, a few verses earlier in the same story, names four rivers. Follow the clues to where Eden might have been."),
  c("mystery-eden", "apple", "go_deeper", "text", 1,
    "Everyone pictures an apple in that garden.",
    "Same story, Genesis 2–3. See what the text actually says about the fruit."),

  // 2 Corinthians 12
  c("mystery-thorn", "unanswered-prayer", "bigger_picture", "text", 1,
    "Paul asked three times. What about the prayers that don’t get a yes?",
    "This Big Question also opens with 2 Corinthians 12:8–9, and asks why God doesn’t answer every prayer the way we hope."),
  c("unanswered-prayer", "mystery-thorn", "go_deeper", "text", 1,
    "Paul never says what his thorn was. Want to look at the clues?",
    "The same passage, 2 Corinthians 12:7–10, opened as a case: what people think the thorn was, and why nobody can be sure."),

  // the shepherd
  c("lost-sheep", "connect-shepherd", "bigger_picture", "theme", 1,
    "This isn’t the only shepherd in the Bible.",
    "God as a shepherd runs from Psalm 23 to Ezekiel 34 to John 10. Luke 15 isn’t quoted there; it shares the picture."),
  c("connect-shepherd", "lost-sheep", "go_deeper", "theme", 1,
    "What does a shepherd do when one goes missing?",
    "A story Jesus told in Luke 15 that uses the same picture: a shepherd who goes after the one."),

  // forgiveness and serving, in life
  c("corrie-ten-boom", "everyday-apology", "everyday_application", "application", 1,
    "Most of us won’t face what Corrie faced. But most of us are waiting on an apology.",
    "Corrie forgave a man who hurt her terribly. This one brings forgiveness down to an ordinary week."),
  c("john-newton", "forgive-anyone", "bigger_picture", "theme", 1,
    "Could God really forgive someone like that?",
    "Newton believed he was forgiven after years in the slave trade. This Big Question looks at what Scripture says about forgiving anyone."),
  c("brother-lawrence", "everyday-noticed", "everyday_application", "application", 1,
    "What if nobody ever sees the good you do?",
    "Brother Lawrence spent years on work nobody praised. This one is about serving when no one notices."),
  c("everyday-noticed", "brother-lawrence", "bigger_picture", "application", 1,
    "Meet a man who found God at the kitchen sink.",
    "A real life lived the way Matthew 6:4 describes: unseen work, done for God."),
  c("jesus-washed-feet", "everyday-noticed", "everyday_application", "application", 1,
    "Jesus picked up a towel. Where’s the towel in your week?",
    "Jesus took the servant’s job in John 13. This one asks what quiet serving looks like for you."),

  // Ruth
  c("ruth", "book-ruth", "bigger_picture", "text", 1,
    "Naomi comes home empty. That isn’t how the book ends.",
    "This was Ruth 1. See the whole four chapters, and the moment Naomi’s outlook turns."),
  c("book-ruth", "ruth", "go_deeper", "text", 1,
    "Want to stand on the road with Ruth and Naomi?",
    "Ruth 1:16–17 was one stop in the overview. This one stays with that first chapter."),

  // Exodus to John
  c("connect-lamb", "connect-bread", "continue_story", "narrative", 1,
    "Passover was Exodus 12. Four chapters later, bread falls from the sky.",
    "The next thread from the same journey out of Egypt: the manna in Exodus 16, which Jesus speaks about in John 6."),
  c("connect-bread", "book-john", "bigger_picture", "text", 1,
    "“I am the bread of life” is one line. What’s the rest of John like?",
    "John 6:35 is in this Gospel. See where it sits among the signs, from the wedding to the empty tomb."),
  c("book-john", "jesus-well", "go_deeper", "text", 1,
    "A woman at a well, at noon. Why was she alone?",
    "John 4 was one stop in the overview. This one stays with that conversation."),

  // Psalm 51
  c("psalm-51", "pray-forgive", "everyday_application", "text", 1,
    "You read David’s words. Want to pray your own?",
    "This prayer lesson uses Psalm 51 to help you ask for forgiveness in your own words."),
  c("pray-forgive", "psalm-51", "go_deeper", "text", 1,
    "Want to read the whole psalm this prayer comes from?",
    "Psalm 51, all nineteen verses, and why many Bibles link it to David."),

  // suffering
  c("more-than-you-can-handle", "romans-8-28", "go_deeper", "theme", 1,
    "If not “more than you can handle”, then what does Paul promise?",
    "Another verse people quote in hard times. Romans 8:28 read in its own chapter, where Paul talks honestly about suffering."),
  c("why-suffering", "jesus-wept", "go_deeper", "text", 1,
    "Jesus knew what he was about to do. He cried anyway.",
    "This question looked at John 11. Sit in that scene at Lazarus’s tomb."),
  c("jesus-wept", "why-suffering", "bigger_picture", "text", 1,
    "Why does God allow suffering at all?",
    "A Big Question that includes this same scene in John 11, beside Job and Luke 13."),

  // everyday
  c("everyday-promotion", "everyday-ahead", "go_deeper", "application", 1,
    "One person’s good news can turn into everyone else is ahead.",
    "Jealousy of one person often grows into comparing yourself with everyone. Philippians 4 talks about contentment."),
];

/* ---------- reading the graph ---------- */

const BOOKS = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Psalm", "Proverbs", "Ecclesiastes", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"];
const refsOf = (s: string) => s.split("·").map(x => x.trim()).filter(Boolean);
const booksOf = (refs: string[]) => [...new Set(refs.map(r => BOOKS.find(b => r === b || r.startsWith(b + " "))).filter((b): b is string => !!b).map(b => (b === "Psalm" ? "Psalms" : b)))];

/* The shelf a lesson is published on. A lesson that's on no shelf can't be reached, so it isn't published. */
const SHELF: Record<string, { id: string; label: string }> = {};
for (const s of library) for (const e of s.entries) if (e.lessonId && !SHELF[e.lessonId] && s.id !== "people" && s.id !== "verses") SHELF[e.lessonId] = { id: s.id, label: s.label };
for (const s of library) for (const e of s.entries) if (e.lessonId && !SHELF[e.lessonId]) SHELF[e.lessonId] = { id: s.id, label: s.label };

const fromLesson = (l: Lesson): Experience => {
  const refs = refsOf(l.scripture), shelf = SHELF[l.id];
  return {
    id: l.id, title: l.title, categoryId: shelf?.id ?? "", categoryLabel: shelf?.label ?? "",
    scriptureReferences: refs, characters: ABOUT[l.id]?.characters ?? [], themes: ABOUT[l.id]?.themes ?? [],
    biblicalBooks: booksOf(refs), estimatedDuration: l.minutes, publicationStatus: shelf ? "published" : "planned",
  };
};

const cache: Record<string, Experience | null> = {};
export function experience(id: string): Experience | null {
  if (id in cache) return cache[id];
  const l = LESSONS[id], p = PLANNED[id];
  const label = (cid: string) => library.find(s => s.id === cid)?.label ?? "";
  cache[id] = l ? fromLesson(l)
    : p ? { id, title: p.title, categoryId: p.categoryId, categoryLabel: label(p.categoryId), scriptureReferences: refsOf(p.scripture), characters: ABOUT[id]?.characters ?? [], themes: ABOUT[id]?.themes ?? [], biblicalBooks: booksOf(refsOf(p.scripture)), estimatedDuration: p.minutes, publicationStatus: "planned" }
    : null;
  return cache[id];
}

const isRetelling = (a: string, b: string) => RETELLINGS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/* A link can be shown when it's approved, both ends are real, the target is published and playable, and it isn't
   the same lesson or the same story told again. */
export function showable(cn: Connection) {
  const t = experience(cn.targetExperienceId);
  return cn.editorialStatus === "approved" && !!experience(cn.sourceExperienceId) && !!t && t.publicationStatus === "published" && !!LESSONS[t.id]
    && cn.sourceExperienceId !== cn.targetExperienceId && !isRetelling(cn.sourceExperienceId, cn.targetExperienceId);
}

export type Discovery = { connection: Connection; experience: Experience; finished: boolean };

/* Every showable link from a lesson, best first, one per target. Deterministic: the editorial priority leads; a
   target you've already finished drops a step and a half, so an unfinished link up to one step weaker goes first;
   then a different shelf is preferred, for variety; then the order written above. */
export function discoveriesFrom(id: string, finished: string[] = []): Discovery[] {
  const src = experience(id);
  if (!src) return [];
  const seen = new Set<string>();
  return CONNECTIONS
    .map((cn, i) => ({ cn, i }))
    .filter(({ cn }) => cn.sourceExperienceId === id && showable(cn))
    .map(({ cn, i }) => {
      const done = finished.includes(cn.targetExperienceId), t = experience(cn.targetExperienceId)!;
      return { cn, i, t, done, score: cn.priority + (done ? 1.5 : 0) + (t.categoryId === src.categoryId ? 0.1 : 0) };
    })
    .sort((a, b) => a.score - b.score || a.i - b.i)
    .filter(({ cn }) => (seen.has(cn.targetExperienceId) ? false : (seen.add(cn.targetExperienceId), true)))
    .map(({ cn, t, done }) => ({ connection: cn, experience: t, finished: done }));
}

/* The one next step shown after a lesson, if there's a good one */
export const recommend = (id: string, finished: string[] = []) => discoveriesFrom(id, finished)[0] ?? null;

/* A few more, grouped by kind of link, never more than four and never an empty group */
export function exploreMore(id: string, finished: string[] = [], max = 4) {
  const rest = discoveriesFrom(id, finished).slice(1, 1 + max);
  return (Object.keys(CONNECTION_TYPES) as ConnectionType[])
    .map(type => ({ type, label: CONNECTION_TYPES[type].label, items: rest.filter(d => d.connection.type === type) }))
    .filter(g => g.items.length);
}

/* Links between lessons you've finished, and from them to ones you haven't yet: for the network in You */
export function networkOf(finished: string[]) {
  const done = new Set(finished.filter(id => experience(id)?.publicationStatus === "published"));
  const edges = CONNECTIONS.filter(cn => showable(cn) && done.has(cn.sourceExperienceId));
  const pairs = new Map<string, Connection>();
  for (const e of edges) { const k = [e.sourceExperienceId, e.targetExperienceId].sort().join("|"); if (!pairs.has(k)) pairs.set(k, e); }
  const ids = new Set<string>(done);
  for (const e of pairs.values()) ids.add(e.targetExperienceId);
  return {
    nodes: [...ids].map(id => ({ ...experience(id)!, finished: done.has(id) })),
    edges: [...pairs.values()],
  };
}

/* Problems in the registry: run by the check script and in development. Empty means every link is sound. */
export function validateGraph(): string[] {
  const out: string[] = [], keys = new Set<string>();
  for (const cn of CONNECTIONS) {
    const k = `${cn.sourceExperienceId} → ${cn.targetExperienceId}`;
    if (keys.has(k)) out.push(`duplicate link ${k}`);
    keys.add(k);
    if (cn.sourceExperienceId === cn.targetExperienceId) out.push(`links to itself: ${k}`);
    if (!LESSONS[cn.sourceExperienceId]) out.push(`source isn’t a lesson: ${k}`);
    if (!experience(cn.targetExperienceId)) out.push(`target doesn’t exist: ${k}`);
    if (isRetelling(cn.sourceExperienceId, cn.targetExperienceId)) out.push(`same story told twice: ${k}`);
    if (!cn.explanation.trim() || !cn.curiosityHook.trim()) out.push(`missing words: ${k}`);
    if (cn.curiosityHook.length > 90) out.push(`hook too long (${cn.curiosityHook.length}): ${k}`);
    if (cn.explanation.length > 200) out.push(`explanation too long (${cn.explanation.length}): ${k}`);
  }
  for (const cn of CONNECTIONS) if (!THREADS.find(t => t.lessons.includes(cn.sourceExperienceId) && t.lessons.includes(cn.targetExperienceId))) out.push(`no constellation for ${cn.sourceExperienceId} → ${cn.targetExperienceId}`);
  for (const id of Object.keys(PLANNED)) if (LESSONS[id]) out.push(`planned lesson ${id} now exists: remove it from PLANNED`);
  return out;
}

/* ---------- constellations: the night sky in You ---------- */

/* Each group of links is one constellation, named for what it follows. A lesson can sit in more than one. */
export type Thread = { id: string; sky: string; name: string; note: string; lessons: string[] };
export const THREADS: Thread[] = [
  { id: "peter", sky: "The Fisherman", name: "On the lake", note: "Peter, a boat and two storms", lessons: ["jesus-storm", "jesus-peter-sank", "forgive-anyone", "book-mark", "jesus-restores-peter"] },
  { id: "lament", sky: "The Lament", name: "How long?", note: "Psalm 13, said honestly", lessons: ["god-far-away", "psalm-13", "pray-angry"] },
  { id: "magi", sky: "The Star", name: "Matthew 2", note: "Visitors from the east", lessons: ["three-wise-men", "mystery-star"] },
  { id: "eden", sky: "The Garden", name: "Genesis 2–3", note: "A fruit and four rivers", lessons: ["apple", "mystery-eden"] },
  { id: "thorn", sky: "The Thorn", name: "2 Corinthians 12", note: "Paul asked three times", lessons: ["mystery-thorn", "unanswered-prayer"] },
  { id: "shepherd", sky: "The Shepherd", name: "The shepherd", note: "One sheep, and the one who looks for it", lessons: ["lost-sheep", "connect-shepherd"] },
  { id: "forgiving", sky: "The Open Hand", name: "Forgiving", note: "From a camp to an ordinary week", lessons: ["corrie-ten-boom", "everyday-apology", "john-newton", "forgive-anyone"] },
  { id: "serving", sky: "The Towel", name: "Serving quietly", note: "Work nobody sees", lessons: ["jesus-washed-feet", "brother-lawrence", "everyday-noticed"] },
  { id: "ruth", sky: "The Road Home", name: "Ruth", note: "Two widows and a field", lessons: ["ruth", "book-ruth"] },
  { id: "exodus", sky: "The Bread", name: "Out of Egypt", note: "From Passover to John", lessons: ["connect-lamb", "connect-bread", "book-john", "jesus-well"] },
  { id: "psalm51", sky: "The Clean Heart", name: "Psalm 51", note: "Saying sorry to God", lessons: ["psalm-51", "pray-forgive"] },
  { id: "suffering", sky: "The Tears", name: "When it hurts", note: "Suffering, read honestly", lessons: ["more-than-you-can-handle", "romans-8-28", "why-suffering", "jesus-wept"] },
  { id: "comparing", sky: "The Mirror", name: "Everyone else", note: "Jealousy and enough", lessons: ["everyday-promotion", "everyday-ahead"] },
];
export const threadOf = (cn: Connection) => THREADS.find(t => t.lessons.includes(cn.sourceExperienceId) && t.lessons.includes(cn.targetExperienceId));

export type Star = Experience & { finished: boolean; hook?: string; via?: Connection };
export type Constellation = Thread & { stars: Star[]; lines: [string, string][] };

/* The constellations you've started: every finished story in a group lights its star; the stories one link away
   show as faint stars carrying that link's hook. Nothing further out is shown, so it never turns into a map of
   everything. Stars are in the order you'd walk them. */
export function constellations(finished: string[]): Constellation[] {
  const done = new Set(finished);
  const out: Constellation[] = [];
  for (const th of THREADS) {
    const links = CONNECTIONS.filter(cn => showable(cn) && threadOf(cn)?.id === th.id);
    const lit = th.lessons.filter(id => done.has(id) && experience(id)?.publicationStatus === "published");
    if (!lit.length) continue;
    const stars = new Map<string, Star>();
    for (const id of lit) stars.set(id, { ...experience(id)!, finished: true });
    for (const cn of links) {
      const [from, to] = [cn.sourceExperienceId, cn.targetExperienceId];
      if (done.has(from) && !done.has(to) && !stars.has(to)) stars.set(to, { ...experience(to)!, finished: false, hook: cn.curiosityHook, via: cn });
    }
    const pairs = new Map<string, [string, string]>();
    for (const cn of links) {
      const a = cn.sourceExperienceId, b = cn.targetExperienceId;
      if (stars.has(a) && stars.has(b)) pairs.set([a, b].sort().join("|"), [a, b]);
    }
    // walk order: start from the first star, follow lines, then anything left
    const order: string[] = [], seen = new Set<string>(), queue = [th.lessons.find(id => stars.has(id))!];
    while (queue.length) {
      const id = queue.shift()!; if (seen.has(id)) continue; seen.add(id); order.push(id);
      for (const [a, b] of pairs.values()) { if (a === id && !seen.has(b)) queue.push(b); if (b === id && !seen.has(a)) queue.push(a); }
    }
    for (const id of stars.keys()) if (!seen.has(id)) order.push(id);
    out.push({ ...th, stars: order.map(id => stars.get(id)!), lines: [...pairs.values()] });
  }
  return out;
}
