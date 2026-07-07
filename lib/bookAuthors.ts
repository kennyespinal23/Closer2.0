import type { Book } from "@/constants/books";

const BOOK_AUTHORS: Record<string, string> = {
  genesis: "Moses",
  exodus: "Moses",
  leviticus: "Moses",
  numbers: "Moses",
  deuteronomy: "Moses",
  joshua: "Joshua",
  judges: "Samuel",
  ruth: "Samuel",
  "1-samuel": "Samuel",
  "2-samuel": "Samuel",
  "1-kings": "Jeremiah",
  "2-kings": "Jeremiah",
  "1-chronicles": "Ezra",
  "2-chronicles": "Ezra",
  ezra: "Ezra",
  nehemiah: "Nehemiah",
  esther: "Mordecai",
  job: "Job",
  psalms: "David",
  proverbs: "Solomon",
  ecclesiastes: "Solomon",
  "song-of-solomon": "Solomon",
  isaiah: "Isaiah",
  jeremiah: "Jeremiah",
  lamentations: "Jeremiah",
  ezekiel: "Ezekiel",
  daniel: "Daniel",
  hosea: "Hosea",
  joel: "Joel",
  amos: "Amos",
  obadiah: "Obadiah",
  jonah: "Jonah",
  micah: "Micah",
  nahum: "Nahum",
  habakkuk: "Habakkuk",
  zephaniah: "Zephaniah",
  haggai: "Haggai",
  zechariah: "Zechariah",
  malachi: "Malachi",
  matthew: "Matthew",
  mark: "Mark",
  luke: "Luke",
  john: "John",
  acts: "Luke",
  romans: "Paul",
  "1-corinthians": "Paul",
  "2-corinthians": "Paul",
  galatians: "Paul",
  ephesians: "Paul",
  philippians: "Paul",
  colossians: "Paul",
  "1-thessalonians": "Paul",
  "2-thessalonians": "Paul",
  "1-timothy": "Paul",
  "2-timothy": "Paul",
  titus: "Paul",
  philemon: "Paul",
  hebrews: "Unknown",
  james: "James",
  "1-peter": "Peter",
  "2-peter": "Peter",
  "1-john": "John",
  "2-john": "John",
  "3-john": "John",
  jude: "Jude",
  revelation: "John",
};

export function getBookAuthor(bookId: string): string {
  return BOOK_AUTHORS[bookId] ?? "Unknown";
}

export function getTestamentPositionLabel(book: Book): string {
  const position =
    book.testament === "old" ? book.order : book.order - 39;
  const testament =
    book.testament === "old" ? "Old Testament" : "New Testament";
  return `Book ${position} of the ${testament}`;
}

export function getChapterCountLabel(chapters: number): string {
  return `${chapters} ${chapters === 1 ? "chapter" : "chapters"}`;
}
