/**
 * Short editorial blurbs for the book overview screen's "About"
 * section. Mirrors the registry-style pattern used by bookCovers.ts
 * — only books with an entry get the section rendered.
 *
 * Style guide for blurbs:
 *   • 2–3 sentences max — the screen has other sections to breathe
 *   • Present tense, plainspoken, not preachy
 *   • Set up *what* the book is, *who* it speaks to, and a hint of
 *     *why it matters* — without spoiling the story or sermonizing
 */

const BLURBS: Record<string, string> = {
  job: "When a righteous man loses everything, he and his friends try to make sense of his suffering. The book ends with God's own answer — not a why, but a who. One of the oldest stories in Scripture, and still one of the most honest.",

  genesis:
    "The first book of the Bible. Beginnings of the world, of humanity, and of the family God chooses to bless every nation through. Reads like a slow, patient origin story for everything that follows.",

  psalms:
    "Israel's prayer book and hymnal. Songs of praise, lament, anger, gratitude, and quiet trust — the full range of life turned Godward. Meant to be read out loud, often.",

  proverbs:
    "Practical wisdom for ordinary life — how to speak honestly, work faithfully, raise children, and keep your soul soft. Compact, memorable, and meant to be returned to.",

  ecclesiastes:
    "A teacher looks at every pursuit under the sun and asks if any of it lasts. The honesty is bracing; the conclusion is surprisingly hopeful.",

  matthew:
    "The first Gospel — Jesus as the long-awaited king who fulfills Israel's story. Written for a Jewish audience, with five great teaching blocks that anchor the whole narrative.",

  mark:
    "The shortest Gospel, urgent and lean. Jesus moves fast through Galilee and on to Jerusalem — the cross is in view from the first chapter.",

  luke:
    "Jesus told through the eyes of an outsider, written for everyone the world tends to overlook. Some of the most loved parables sit only here.",

  john:
    "The most reflective Gospel. Seven signs, seven 'I am' sayings, and a Jesus who speaks slowly enough that you can sit with each word.",

  romans:
    "Paul's most systematic letter — the gospel laid out in full. Human brokenness, God's righteousness, life in the Spirit, and a future that holds.",

  revelation:
    "A vision given to John on the island of Patmos — apocalyptic poetry about Christ's victory, the church's suffering, and the world made new.",
};

export function getBookBlurb(bookId: string): string | null {
  return BLURBS[bookId] ?? null;
}

export function hasBookBlurb(bookId: string): boolean {
  return getBookBlurb(bookId) !== null;
}
