import type { LibraryBookFrame } from "@/components/LibraryBookcase";
type Opening = { bookId: string; source: LibraryBookFrame; snapshot?: string };
let pending: Opening | null = null;
export function prepareLibraryOpening(value: Opening) { pending = value; }
export function takeLibraryOpening(bookId: string): Opening | null {
  const value = pending?.bookId === bookId ? pending : null;
  pending = null;
  return value;
}
