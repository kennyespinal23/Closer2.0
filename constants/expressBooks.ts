import data from "./expressBooksData.json";

export type ExpressPassage = {
  bookId: string; startChapter: number; startVerse: number;
  endChapter: number; endVerse: number; reference: string;
};
export type ExpressScene = { id: string; title: string; body: string; passages: ExpressPassage[] };
export type ExpressBook = { bookId: string; kind: "scenes" | "beats"; scenes: ExpressScene[] };
export const EXPRESS_BOOKS = data as ExpressBook[];
export const EXPRESS_CLOSING = "That's the shape of the story. The full version is waiting when you're ready.";
export const findExpressBook = (bookId: string) => EXPRESS_BOOKS.find(book => book.bookId === bookId);
export const expressReadingMinutes = (book: ExpressBook) => Math.max(1, Math.ceil(book.scenes.reduce((count, scene) => count + scene.body.split(/\s+/).length, 0) / 200));
