export type MeasuredLine = { text: string; y: number; height: number };
export type ReaderPage = { startLine: number; endLine: number; offsetY: number; contentHeight: number; startVerseIdx: number; endVerseIdx: number; isFirst: boolean };

export function findVerseMarker(
  text: string,
  verseNum: number,
  from: number,
): { idx: number; end: number } | null {
  const plain = `  ${verseNum}  `;
  const plainIdx = text.indexOf(plain, from);
  if (plainIdx !== -1) {
    return { idx: plainIdx, end: plainIdx + plain.length };
  }
  // U+25CF BLACK CIRCLE — the note marker rendered inline next to
  // the verse number. Embed the literal so the regex source mirrors
  // exactly what onTextLayout's `text` field contains.
  const noteRe = new RegExp(`  ${verseNum} ●\\d*  `);
  const slice = text.slice(from);
  const m = noteRe.exec(slice);
  if (m) {
    return { idx: from + m.index, end: from + m.index + m[0].length };
  }
  // Line-start variant: when iOS strips the leading `"  "` from a
  // wrapped / post-newline line, the marker shows up as `"N  body"`
  // (or `"N ●…  body"`) at index 0. Only check at the start of the
  // line to avoid false-positives where a verse body happens to
  // contain something like "10 men" mid-line.
  if (from === 0) {
    const lineStart = `${verseNum}  `;
    if (text.startsWith(lineStart)) {
      return { idx: 0, end: lineStart.length };
    }
    const lineStartNoteRe = new RegExp(`^${verseNum} ●\\d*  `);
    const m2 = lineStartNoteRe.exec(text);
    if (m2) {
      return { idx: 0, end: m2[0].length };
    }
  }
  return null;
}

/** Follow actual verse numbers: some translations omit verses or begin at zero. */
export function findVerseStartLines(lines: ReadonlyArray<MeasuredLine>, verses: ReadonlyArray<{ number: number }>): Map<number, number> {
  const result = new Map<number, number>();
  let next = 0;
  for (let i = 0; i < lines.length && next < verses.length; i++) {
    let cursor = 0;
    while (next < verses.length) {
      const found = findVerseMarker(lines[i].text, verses[next].number, cursor);
      if (!found) break;
      result.set(verses[next].number, i);
      cursor = found.end;
      next++;
    }
  }
  return result;
}

/** Keep each verse on exactly one page. Oversized verses get a scrollable page. */
export function paginateLines(lines: ReadonlyArray<MeasuredLine>, pageHeight: number, headingHeight: number, starts: ReadonlyArray<number>, count: number): ReaderPage[] {
  const page = (from: number, to: number, first: boolean): ReaderPage => {
    const start = starts[from] ?? 0;
    const end = to + 1 < starts.length ? starts[to + 1] - 1 : lines.length - 1;
    return { startLine: start, endLine: end, offsetY: lines[start]?.y ?? 0, contentHeight: end >= start ? lines[end].y + lines[end].height - lines[start].y : 0, startVerseIdx: from, endVerseIdx: to, isFirst: first };
  };
  if (starts.length !== count || !lines.length) return Array.from({ length: count }, (_, i) => page(i, i, i === 0));
  const pages: ReaderPage[] = [];
  let from = 0;
  for (let to = 0; to < count; to++) {
    const candidate = page(from, to, pages.length === 0);
    const room = Math.max(1, pageHeight - (candidate.isFirst ? headingHeight : 0));
    if (candidate.contentHeight > room && to > from) {
      pages.push(page(from, to - 1, pages.length === 0));
      from = to;
    }
  }
  if (count) pages.push(page(from, count - 1, pages.length === 0));
  return pages;
}
