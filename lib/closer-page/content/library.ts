import type { Theme } from "../lesson/types";
import { CASE } from "../lesson/caseTokens";
import { FUTURE_CASES } from "./mysteries";
import { FUTURE_BOOKS } from "./books";
import { BOOK } from "../lesson/bookTokens";
import { CONN } from "../lesson/connTokens";
import { PSALM } from "../lesson/psalmTokens";
import { PSALM_PLANS } from "./psalms-plan";
import { GENRES } from "../lesson/types";

/* What Explore shows. Only entries with a lessonId can be played in this prototype. */
export type Entry = { id: string; title: string; sub: string; tone: Theme | "red"; lessonId?: string };
export type Shelf = { id: string; label: string; entries: Entry[]; /** one line on its Explore band */ promise?: string };

export const library: Shelf[] = [
  {
    id: "jesus", label: "Jesus Only", promise: "Sit with Jesus in the moments the Gospels tell.", entries: [
      { id: "j-feet", title: "The King Who Washed Feet", sub: "John 13 · 5 min", tone: "wine", lessonId: "jesus-washed-feet" },
      { id: "j-tree", title: "The Man in the Tree", sub: "Luke 19 · 5 min", tone: "wine", lessonId: "jesus-zacchaeus" },
      { id: "j-storm", title: "The Storm That Obeyed Him", sub: "Mark 4 · 5 min", tone: "wine", lessonId: "jesus-storm" },
      { id: "j-wept", title: "The Day Jesus Cried", sub: "John 11 · 6 min", tone: "wine", lessonId: "jesus-wept" },
      { id: "j-well", title: "The Woman at the Well", sub: "John 4 · 6 min", tone: "wine", lessonId: "jesus-well" },
      { id: "j-peter", title: "The Moment Peter Sank", sub: "Matthew 14 · 5 min", tone: "wine", lessonId: "jesus-peter-sank" },
    ],
  },
  {
    id: "pray", label: "Learning to Pray", promise: "Learn to pray, gently, with no perfect words required.", entries: [
      { id: "p-0", title: "I Don’t Know What to Say", sub: "Matthew 6", tone: "rose", lessonId: "pray-no-words" },
      { id: "p-1", title: "When You Don’t Have the Words", sub: "Romans 8", tone: "rose", lessonId: "pray-no-words-spirit" },
      { id: "p-2", title: "Teach Me to Pray", sub: "Matthew 6", tone: "rose", lessonId: "pray-teach-me" },
      { id: "p-3", title: "A Prayer of Gratitude", sub: "Philippians 4", tone: "rose", lessonId: "pray-gratitude" },
      { id: "p-4", title: "When You’re Worried", sub: "1 Peter 5", tone: "rose", lessonId: "pray-worried" },
      { id: "p-5", title: "Praying for Someone Else", sub: "1 Timothy 2", tone: "rose", lessonId: "pray-someone" },
      { id: "p-6", title: "When You’re Angry With God", sub: "Psalm 13", tone: "rose", lessonId: "pray-angry" },
      { id: "p-7", title: "Asking for Forgiveness", sub: "Psalm 51", tone: "rose", lessonId: "pray-forgive" },
      { id: "p-8", title: "Learning to Be Still", sub: "Psalm 46", tone: "rose", lessonId: "pray-still" },
    ],
  },
  {
    id: "mysteries", label: "Bible Mysteries", promise: "Investigate what Scripture says, and what it doesn’t.", entries: [
      { id: "c-001", title: "Where did the Ark go?", sub: "Case 001 · Unresolved", tone: "copper", lessonId: "mystery-ark" },
      ...FUTURE_CASES.map(c => ({ id: `c-${c.id}`, title: c.tile, sub: `Case ${c.id} · ${c.ref}`, tone: "copper" as const, lessonId: c.lesson })),
    ],
  },
  {
    id: "books", label: "Bible Books", promise: "Open a whole book and see how it fits together.", entries: [
      { id: "b-mark", title: "Discover the Gospel of Mark", sub: "Mark 1–16 · 5 min", tone: "sky", lessonId: "book-mark" },
      ...FUTURE_BOOKS.map(b => ({ id: `b-${b.id}`, title: b.name, sub: `${GENRES[b.genre]} · ${b.ref}`, tone: "sky" as const, lessonId: `book-${b.id}` })),
    ],
  },
  {
    id: "connections", label: "Connections", promise: "Pull a thread and watch Scripture connect.", entries: [
      { id: "x-lamb", title: "The Lamb", sub: "From Passover to Jesus · 5 min", tone: "orchid", lessonId: "connect-lamb" },
      { id: "x-bread", title: "Bread from Heaven", sub: "Exodus 16 → John 6 · 5 min", tone: "orchid", lessonId: "connect-bread" },
      { id: "x-shepherd", title: "The Shepherd", sub: "Psalm 23 → John 10 · 5 min", tone: "orchid", lessonId: "connect-shepherd" },
      { id: "x-temple", title: "God Dwelling With Us", sub: "Exodus 25 → Revelation 21 · 5 min", tone: "orchid", lessonId: "connect-dwelling" },
    ],
  },
  {
    id: "psalms", label: "Psalms & Emotions", promise: "Bring your feelings, in the psalmists’ words.", entries: [
      { id: "ps-13", title: "When God Feels Far Away", sub: "Sadness · Psalm 13", tone: "seaglass", lessonId: "psalm-13" },
      ...PSALM_PLANS.map(p => ({ id: `ps-${p.id}`, title: p.title, sub: `${p.feeling} · Psalm ${p.psalm}`, tone: "seaglass" as const, lessonId: `psalm-${p.psalm}` })),
    ],
  },
  {
    id: "everyday", label: "Everyday Faith", promise: "Faith in the moments of an ordinary week.", entries: [
      { id: "e-0", title: "They Got the Promotion", sub: "Jealousy · 5 min", tone: "olive", lessonId: "everyday-promotion" },
      { id: "e-1", title: "The Message You Didn’t Send", sub: "Anger · 5 min", tone: "olive", lessonId: "everyday-message" },
      { id: "e-2", title: "Everyone Else Is Ahead", sub: "Comparison · 5 min", tone: "olive", lessonId: "everyday-ahead" },
      { id: "e-3", title: "The Apology You’re Waiting For", sub: "Forgiveness · 5 min", tone: "olive", lessonId: "everyday-apology" },
      { id: "e-4", title: "Nobody Noticed", sub: "Serving quietly · 5 min", tone: "olive", lessonId: "everyday-noticed" },
      { id: "e-5", title: "Just One More Lie", sub: "Honesty · 5 min", tone: "olive", lessonId: "everyday-lie" },
      { id: "e-6", title: "When They Need You Again", sub: "Boundaries · 5 min", tone: "olive", lessonId: "everyday-boundaries" },
      { id: "e-7", title: "The Person Everyone Ignores", sub: "Loving your neighbour · 5 min", tone: "olive", lessonId: "everyday-ignored" },
      { id: "e-8", title: "The Argument at Dinner", sub: "Patience · 5 min", tone: "olive", lessonId: "everyday-dinner" },
    ],
  },
  {
    id: "stories", label: "Stories", promise: "The Bible’s stories, one scene at a time.", entries: [
      { id: "lazarus", title: "Lazarus", sub: "John 11 · 4 min", tone: "forest", lessonId: "lazarus" },
      { id: "sheep", title: "The lost sheep", sub: "Luke 15 · 3 min", tone: "burgundy", lessonId: "lost-sheep" },
      { id: "zacchaeus", title: "Zacchaeus", sub: "Luke 19 · 4 min", tone: "red", lessonId: "zacchaeus" },
      { id: "jonah", title: "Jonah", sub: "Jonah 1–4 · 5 min", tone: "forest", lessonId: "jonah" },
      { id: "ruth", title: "Ruth and Naomi", sub: "Ruth 1 · 4 min", tone: "burgundy", lessonId: "ruth" },
      { id: "storm", title: "The storm", sub: "Mark 4 · 3 min", tone: "red", lessonId: "storm" },
    ],
  },
  {
    id: "myths", label: "Misconceptions", promise: "Things people think the Bible says, checked.", entries: [
      { id: "m-handle", title: "God won’t give you more than you can handle?", sub: "Misconception · 5 min", tone: "navy", lessonId: "more-than-you-can-handle" },
      { id: "m-helps", title: "God helps those who help themselves?", sub: "Misconception · 5 min", tone: "navy", lessonId: "god-helps" },
      { id: "m-money", title: "Money is the root of all evil?", sub: "Misconception · 5 min", tone: "navy", lessonId: "money" },
      { id: "m-three", title: "Three wise men?", sub: "Misconception · 4 min", tone: "navy", lessonId: "three-wise-men" },
      { id: "m-apple", title: "Was it an apple?", sub: "Misconception · 4 min", tone: "navy", lessonId: "apple" },
    ],
  },
  {
    id: "questions", label: "Big Questions", promise: "Honest questions, several faithful answers.", entries: [
      { id: "q-suffering", title: "Why does God allow suffering?", sub: "Big question · 6 min", tone: "teal", lessonId: "why-suffering" },
      { id: "q-prayer", title: "Why doesn’t God answer every prayer?", sub: "Big question · 6 min", tone: "teal", lessonId: "unanswered-prayer" },
      { id: "q-far", title: "Why does God sometimes feel far away?", sub: "Big question · 6 min", tone: "teal", lessonId: "god-far-away" },
      { id: "q-exists", title: "How can we know God exists?", sub: "Big question · 6 min", tone: "teal", lessonId: "god-exists" },
      { id: "q-forgive", title: "Can God forgive anyone?", sub: "Big question · 6 min", tone: "teal", lessonId: "forgive-anyone" },
    ],
  },
  {
    id: "testimonies", label: "Testimonies", promise: "Real lives, told carefully, from the record.", entries: [
      { id: "t-newton", title: "The man behind Amazing Grace", sub: "John Newton · 1725–1807", tone: "walnut", lessonId: "john-newton" },
      { id: "t-augustine", title: "The restless heart", sub: "Augustine of Hippo · 354–430", tone: "walnut", lessonId: "augustine" },
      { id: "t-tenboom", title: "The woman who forgave her captor", sub: "Corrie ten Boom · 1892–1983", tone: "walnut", lessonId: "corrie-ten-boom" },
      { id: "t-muller", title: "The man who built an orphanage on prayer", sub: "George Müller · 1805–1898", tone: "walnut", lessonId: "george-muller" },
      { id: "t-lawrence", title: "The man who found God while washing dishes", sub: "Brother Lawrence · c. 1614–1691", tone: "walnut", lessonId: "brother-lawrence" },
      { id: "t-tubman", title: "The woman who followed her faith to freedom", sub: "Harriet Tubman · c. 1822–1913", tone: "walnut", lessonId: "harriet-tubman" },
      { id: "t-lewis", title: "The atheist who became a Christian", sub: "C. S. Lewis · 1898–1963", tone: "walnut", lessonId: "cs-lewis" },
    ],
  },
  {
    id: "people", label: "People", promise: "The people you meet in its pages.", entries: [
      { id: "p-lazarus", title: "Lazarus", sub: "A friend of Jesus", tone: "forest", lessonId: "lazarus" },
      { id: "martha", title: "Martha", sub: "The one who ran to meet him", tone: "burgundy", lessonId: "lazarus" },
      { id: "p-zacchaeus", title: "Zacchaeus", sub: "Short, rich, up a tree", tone: "red", lessonId: "zacchaeus" },
      { id: "p-jonah", title: "Jonah", sub: "Ran the other way", tone: "forest", lessonId: "jonah" },
      { id: "p-ruth", title: "Ruth", sub: "Wouldn’t leave Naomi", tone: "burgundy", lessonId: "ruth" },
      { id: "peter", title: "Peter", sub: "Fisherman, loud, loyal", tone: "red" },
      { id: "hannah", title: "Hannah", sub: "Prayed when it hurt", tone: "forest" },
      { id: "moses", title: "Moses", sub: "Didn’t think he could talk", tone: "burgundy" },
      { id: "mary-m", title: "Mary Magdalene", sub: "First to the empty tomb", tone: "red" },
    ],
  },
  {
    id: "verses", label: "Verses", promise: "One verse, studied slowly.", entries: [
      { id: "v-rom828", title: "Romans 8:28", sub: "Verse study · 5 min", tone: "burgundy", lessonId: "romans-8-28" },
      { id: "v-john1135", title: "John 11:35", sub: "The shortest verse", tone: "forest", lessonId: "lazarus" },
      { id: "v-ps23", title: "Psalm 23", sub: "The shepherd one", tone: "red" },
      { id: "v-jn316", title: "John 3:16", sub: "The famous one", tone: "forest" },
      { id: "v-phil4", title: "Philippians 4:6–7", sub: "Instead of worry", tone: "burgundy" },
      { id: "v-lam3", title: "Lamentations 3:22", sub: "New every morning", tone: "red" },
      { id: "v-matt11", title: "Matthew 11:28", sub: "Come and rest", tone: "burgundy" },
    ],
  },
  {
    id: "themes", label: "Themes", promise: "Follow a theme across the whole Bible.", entries: [
      { id: "t-forgive", title: "Forgiveness", sub: "12 stories", tone: "burgundy" },
      { id: "t-hope", title: "Hope", sub: "9 stories", tone: "forest" },
      { id: "t-prayer", title: "Prayer", sub: "14 stories", tone: "red" },
      { id: "t-faith", title: "Faith", sub: "11 stories", tone: "forest" },
      { id: "t-grief", title: "Grief", sub: "6 stories", tone: "burgundy" },
      { id: "t-rest", title: "Rest", sub: "7 stories", tone: "red" },
    ],
  },
];

export const TONE: Record<Entry["tone"], { bg: string; fg: string }> = {
  forest: { bg: "#123F32", fg: "#FFF7EB" },
  burgundy: { bg: "#682C42", fg: "#FFF7EB" },
  red: { bg: "#D92B2F", fg: "#FFF7EB" },
  night: { bg: "#0C1D17", fg: "#FFF7EB" },
  navy: { bg: "#253F73", fg: "#FFF7EB" },
  teal: { bg: "#254C58", fg: "#FFF7EB" },
  walnut: { bg: "#70523B", fg: "#FFF7EB" },
  amethyst: { bg: "#7866A8", fg: "#F5EDFF" },
  wine: { bg: "#4A1C2B", fg: "#FFF7EB" },
  olive: { bg: "#777D49", fg: "#F5F1DC" },
  rose: { bg: "#A35D79", fg: "#FFF0F3" },
  copper: { bg: CASE.primary, fg: CASE.parchment },
  sky: { bg: BOOK.primary, fg: BOOK.ink },
  orchid: { bg: CONN.primary, fg: "#FFFFFF" },
  seaglass: { bg: PSALM.primary, fg: PSALM.dark },
  cream: { bg: "#F3E6D2", fg: "#17251F" },
};
