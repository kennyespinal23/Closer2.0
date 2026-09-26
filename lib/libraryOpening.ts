import type { LibraryBookFrame } from "@/components/LibraryBookcase";
type Opening = { bookId: string; source: LibraryBookFrame; snapshot?: string };
let pending: Opening | null = null;
export function prepareLibraryOpening(value: Opening) { pending = value; }
// Reading during render must be repeatable: React can run initializers twice.
export function takeLibraryOpening(bookId: string): Opening | null {
  return pending?.bookId === bookId ? pending : null;
}
export function clearLibraryOpening(value: Opening | null) {
  if (pending === value) pending = null;
}
