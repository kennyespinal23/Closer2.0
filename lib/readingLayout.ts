export type ReadingLayout = 'pages' | 'passages' | 'verse';
export const READING_LAYOUTS: { id: ReadingLayout; name: string }[] = [
  { id: 'pages', name: 'Pages' }, { id: 'passages', name: 'Passages' }, { id: 'verse', name: 'One verse' },
];
/** Keep verse text intact. Short passages end at a sentence boundary, up to three verses. */
export function groupReadingVerses(verses: readonly { text: string }[], layout: ReadingLayout) {
  const groups: { startVerseIdx: number; endVerseIdx: number }[] = [];
  let start = 0;
  while (start < verses.length) {
    let end = start, words = verses[start].text.split(/\s+/).length;
    if (layout === 'passages') {
      while (end + 1 < verses.length && end - start < 2) {
        const next = verses[end + 1].text.split(/\s+/).length;
        if (words + next > 85 || (words >= 45 && /[.!?][”’"']?$/.test(verses[end].text))) break;
        words += next; end++;
      }
    }
    groups.push({ startVerseIdx: start, endVerseIdx: end }); start = end + 1;
  }
  return groups;
}
