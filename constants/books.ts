/**
 * Books of the Bible — Protestant canon (66 books).
 *
 * Catholic & Orthodox traditions include additional deuterocanonical
 * books (Tobit, Judith, Wisdom, Sirach, Baruch, 1–2 Maccabees, etc.).
 * If we ever offer a "canon" preference, those slot in here without
 * needing to change the screen layer — every consumer reads from
 * `BOOKS` and the helpers below.
 */

export type Testament = "old" | "new";

/**
 * Liturgical / scholarly groupings. The single-book groups (Acts,
 * Revelation) are intentional — they're structurally significant
 * enough in the canon to stand alone in the UI.
 */
export type BookCategory =
  | "The Law"
  | "Historical Books"
  | "Wisdom & Poetry"
  | "Major Prophets"
  | "Minor Prophets"
  | "Gospels"
  | "Acts"
  | "Pauline Epistles"
  | "General Epistles"
  | "Apocalyptic";

export type Book = {
  /** URL-safe slug — used as the route param in /book/[id]. */
  id: string;
  name: string;
  abbr: string;
  testament: Testament;
  category: BookCategory;
  chapters: number;
  /** Canonical 1–66 position. Useful for sorting and display. */
  order: number;
};

// ─────────────────────────────────────────────────────────────────
// Old Testament — 39 books
// ─────────────────────────────────────────────────────────────────

const OT: Book[] = [
  { id: "genesis",        name: "Genesis",        abbr: "Gen",  testament: "old", category: "The Law",          chapters: 50, order: 1 },
  { id: "exodus",         name: "Exodus",         abbr: "Ex",   testament: "old", category: "The Law",          chapters: 40, order: 2 },
  { id: "leviticus",      name: "Leviticus",      abbr: "Lev",  testament: "old", category: "The Law",          chapters: 27, order: 3 },
  { id: "numbers",        name: "Numbers",        abbr: "Num",  testament: "old", category: "The Law",          chapters: 36, order: 4 },
  { id: "deuteronomy",    name: "Deuteronomy",    abbr: "Deut", testament: "old", category: "The Law",          chapters: 34, order: 5 },

  { id: "joshua",         name: "Joshua",         abbr: "Josh", testament: "old", category: "Historical Books", chapters: 24, order: 6 },
  { id: "judges",         name: "Judges",         abbr: "Judg", testament: "old", category: "Historical Books", chapters: 21, order: 7 },
  { id: "ruth",           name: "Ruth",           abbr: "Ruth", testament: "old", category: "Historical Books", chapters: 4,  order: 8 },
  { id: "1-samuel",       name: "1 Samuel",       abbr: "1 Sam",testament: "old", category: "Historical Books", chapters: 31, order: 9 },
  { id: "2-samuel",       name: "2 Samuel",       abbr: "2 Sam",testament: "old", category: "Historical Books", chapters: 24, order: 10 },
  { id: "1-kings",        name: "1 Kings",        abbr: "1 Kgs",testament: "old", category: "Historical Books", chapters: 22, order: 11 },
  { id: "2-kings",        name: "2 Kings",        abbr: "2 Kgs",testament: "old", category: "Historical Books", chapters: 25, order: 12 },
  { id: "1-chronicles",   name: "1 Chronicles",   abbr: "1 Chr",testament: "old", category: "Historical Books", chapters: 29, order: 13 },
  { id: "2-chronicles",   name: "2 Chronicles",   abbr: "2 Chr",testament: "old", category: "Historical Books", chapters: 36, order: 14 },
  { id: "ezra",           name: "Ezra",           abbr: "Ezra", testament: "old", category: "Historical Books", chapters: 10, order: 15 },
  { id: "nehemiah",       name: "Nehemiah",       abbr: "Neh",  testament: "old", category: "Historical Books", chapters: 13, order: 16 },
  { id: "esther",         name: "Esther",         abbr: "Esth", testament: "old", category: "Historical Books", chapters: 10, order: 17 },

  { id: "job",            name: "Job",            abbr: "Job",  testament: "old", category: "Wisdom & Poetry",  chapters: 42, order: 18 },
  { id: "psalms",         name: "Psalms",         abbr: "Ps",   testament: "old", category: "Wisdom & Poetry",  chapters: 150,order: 19 },
  { id: "proverbs",       name: "Proverbs",       abbr: "Prov", testament: "old", category: "Wisdom & Poetry",  chapters: 31, order: 20 },
  { id: "ecclesiastes",   name: "Ecclesiastes",   abbr: "Eccl", testament: "old", category: "Wisdom & Poetry",  chapters: 12, order: 21 },
  { id: "song-of-solomon",name: "Song of Solomon",abbr: "Song", testament: "old", category: "Wisdom & Poetry",  chapters: 8,  order: 22 },

  { id: "isaiah",         name: "Isaiah",         abbr: "Isa",  testament: "old", category: "Major Prophets",   chapters: 66, order: 23 },
  { id: "jeremiah",       name: "Jeremiah",       abbr: "Jer",  testament: "old", category: "Major Prophets",   chapters: 52, order: 24 },
  { id: "lamentations",   name: "Lamentations",   abbr: "Lam",  testament: "old", category: "Major Prophets",   chapters: 5,  order: 25 },
  { id: "ezekiel",        name: "Ezekiel",        abbr: "Ezek", testament: "old", category: "Major Prophets",   chapters: 48, order: 26 },
  { id: "daniel",         name: "Daniel",         abbr: "Dan",  testament: "old", category: "Major Prophets",   chapters: 12, order: 27 },

  { id: "hosea",          name: "Hosea",          abbr: "Hos",  testament: "old", category: "Minor Prophets",   chapters: 14, order: 28 },
  { id: "joel",           name: "Joel",           abbr: "Joel", testament: "old", category: "Minor Prophets",   chapters: 3,  order: 29 },
  { id: "amos",           name: "Amos",           abbr: "Amos", testament: "old", category: "Minor Prophets",   chapters: 9,  order: 30 },
  { id: "obadiah",        name: "Obadiah",        abbr: "Obad", testament: "old", category: "Minor Prophets",   chapters: 1,  order: 31 },
  { id: "jonah",          name: "Jonah",          abbr: "Jon",  testament: "old", category: "Minor Prophets",   chapters: 4,  order: 32 },
  { id: "micah",          name: "Micah",          abbr: "Mic",  testament: "old", category: "Minor Prophets",   chapters: 7,  order: 33 },
  { id: "nahum",          name: "Nahum",          abbr: "Nah",  testament: "old", category: "Minor Prophets",   chapters: 3,  order: 34 },
  { id: "habakkuk",       name: "Habakkuk",       abbr: "Hab",  testament: "old", category: "Minor Prophets",   chapters: 3,  order: 35 },
  { id: "zephaniah",      name: "Zephaniah",      abbr: "Zeph", testament: "old", category: "Minor Prophets",   chapters: 3,  order: 36 },
  { id: "haggai",         name: "Haggai",         abbr: "Hag",  testament: "old", category: "Minor Prophets",   chapters: 2,  order: 37 },
  { id: "zechariah",      name: "Zechariah",      abbr: "Zech", testament: "old", category: "Minor Prophets",   chapters: 14, order: 38 },
  { id: "malachi",        name: "Malachi",        abbr: "Mal",  testament: "old", category: "Minor Prophets",   chapters: 4,  order: 39 },
];

// ─────────────────────────────────────────────────────────────────
// New Testament — 27 books
// ─────────────────────────────────────────────────────────────────

const NT: Book[] = [
  { id: "matthew",        name: "Matthew",        abbr: "Matt", testament: "new", category: "Gospels",          chapters: 28, order: 40 },
  { id: "mark",           name: "Mark",           abbr: "Mark", testament: "new", category: "Gospels",          chapters: 16, order: 41 },
  { id: "luke",           name: "Luke",           abbr: "Luke", testament: "new", category: "Gospels",          chapters: 24, order: 42 },
  { id: "john",           name: "John",           abbr: "John", testament: "new", category: "Gospels",          chapters: 21, order: 43 },

  { id: "acts",           name: "Acts",           abbr: "Acts", testament: "new", category: "Acts",             chapters: 28, order: 44 },

  { id: "romans",         name: "Romans",         abbr: "Rom",  testament: "new", category: "Pauline Epistles", chapters: 16, order: 45 },
  { id: "1-corinthians",  name: "1 Corinthians",  abbr: "1 Cor",testament: "new", category: "Pauline Epistles", chapters: 16, order: 46 },
  { id: "2-corinthians",  name: "2 Corinthians",  abbr: "2 Cor",testament: "new", category: "Pauline Epistles", chapters: 13, order: 47 },
  { id: "galatians",      name: "Galatians",      abbr: "Gal",  testament: "new", category: "Pauline Epistles", chapters: 6,  order: 48 },
  { id: "ephesians",      name: "Ephesians",      abbr: "Eph",  testament: "new", category: "Pauline Epistles", chapters: 6,  order: 49 },
  { id: "philippians",    name: "Philippians",    abbr: "Phil", testament: "new", category: "Pauline Epistles", chapters: 4,  order: 50 },
  { id: "colossians",     name: "Colossians",     abbr: "Col",  testament: "new", category: "Pauline Epistles", chapters: 4,  order: 51 },
  { id: "1-thessalonians",name: "1 Thessalonians",abbr: "1 Th", testament: "new", category: "Pauline Epistles", chapters: 5,  order: 52 },
  { id: "2-thessalonians",name: "2 Thessalonians",abbr: "2 Th", testament: "new", category: "Pauline Epistles", chapters: 3,  order: 53 },
  { id: "1-timothy",      name: "1 Timothy",      abbr: "1 Tim",testament: "new", category: "Pauline Epistles", chapters: 6,  order: 54 },
  { id: "2-timothy",      name: "2 Timothy",      abbr: "2 Tim",testament: "new", category: "Pauline Epistles", chapters: 4,  order: 55 },
  { id: "titus",          name: "Titus",          abbr: "Titus",testament: "new", category: "Pauline Epistles", chapters: 3,  order: 56 },
  { id: "philemon",       name: "Philemon",       abbr: "Phlm", testament: "new", category: "Pauline Epistles", chapters: 1,  order: 57 },

  { id: "hebrews",        name: "Hebrews",        abbr: "Heb",  testament: "new", category: "General Epistles", chapters: 13, order: 58 },
  { id: "james",          name: "James",          abbr: "Jas",  testament: "new", category: "General Epistles", chapters: 5,  order: 59 },
  { id: "1-peter",        name: "1 Peter",        abbr: "1 Pet",testament: "new", category: "General Epistles", chapters: 5,  order: 60 },
  { id: "2-peter",        name: "2 Peter",        abbr: "2 Pet",testament: "new", category: "General Epistles", chapters: 3,  order: 61 },
  { id: "1-john",         name: "1 John",         abbr: "1 Jn", testament: "new", category: "General Epistles", chapters: 5,  order: 62 },
  { id: "2-john",         name: "2 John",         abbr: "2 Jn", testament: "new", category: "General Epistles", chapters: 1,  order: 63 },
  { id: "3-john",         name: "3 John",         abbr: "3 Jn", testament: "new", category: "General Epistles", chapters: 1,  order: 64 },
  { id: "jude",           name: "Jude",           abbr: "Jude", testament: "new", category: "General Epistles", chapters: 1,  order: 65 },

  { id: "revelation",     name: "Revelation",     abbr: "Rev",  testament: "new", category: "Apocalyptic",      chapters: 22, order: 66 },
];

export const BOOKS: ReadonlyArray<Book> = [...OT, ...NT];

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Section order for each testament — used to render category cards
 * in the canonical order (not alphabetically, not by category-name
 * length, but in the order someone reading their Bible would
 * encounter them).
 */
export const OT_CATEGORY_ORDER: BookCategory[] = [
  "The Law",
  "Historical Books",
  "Wisdom & Poetry",
  "Major Prophets",
  "Minor Prophets",
];

export const NT_CATEGORY_ORDER: BookCategory[] = [
  "Gospels",
  "Acts",
  "Pauline Epistles",
  "General Epistles",
  "Apocalyptic",
];

export function findBookById(id: string): Book | undefined {
  return BOOKS.find((b) => b.id === id);
}

/**
 * Other books in the same category, in canonical order, excluding
 * the one passed in. Used by the book overview screen's "More from
 * {category}" carousel — a small recommendation surface that feels
 * editorial rather than algorithmic, since the canon already groups
 * books that "belong together".
 */
export function siblingBooks(bookId: string): Book[] {
  const book = findBookById(bookId);
  if (!book) return [];
  return BOOKS.filter(
    (b) => b.category === book.category && b.id !== book.id,
  ).sort((a, b) => a.order - b.order);
}

/**
 * Group a flat list of books by their category, preserving the
 * canonical category order. Empty categories are dropped — handy
 * when search results only land in a couple of sections.
 */
export function groupByCategory(
  books: ReadonlyArray<Book>,
  testament: Testament,
): { category: BookCategory; books: Book[] }[] {
  const order =
    testament === "old" ? OT_CATEGORY_ORDER : NT_CATEGORY_ORDER;
  return order
    .map((category) => ({
      category,
      books: books.filter((b) => b.category === category),
    }))
    .filter((group) => group.books.length > 0);
}

export function filterBooks(
  testament: Testament,
  query: string,
): Book[] {
  const tBooks = BOOKS.filter((b) => b.testament === testament);
  const q = query.trim().toLowerCase();
  if (!q) return tBooks;
  return tBooks.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.abbr.toLowerCase().includes(q),
  );
}
