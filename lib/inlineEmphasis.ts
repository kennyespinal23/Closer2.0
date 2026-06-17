/**
 * Tiny inline emphasis parser for sermon body prose.
 *
 * The catalog at `assets/data/sermons.js` authors body text as
 * plain strings with three lightweight emphasis markers:
 *
 *   • `**word**`     → bold
 *   • `*word*`       → italic
 *   • `***word***`   → bold + italic
 *
 * Why a hand-rolled parser instead of a full Markdown library:
 *   We only need three inline marks across the whole reading
 *   surface (no headings, lists, links, code, blockquotes), and
 *   pulling in `react-native-markdown-display` or `marked` for
 *   ~25 lines of regex is a JS-bundle and dependency cost we
 *   don't want to pay. Stylistic emphasis is the entire feature.
 *
 * Why explicit segments (not a tree):
 *   The caller (`app/sermon/panel/[id].tsx`) renders the body
 *   inside a single `<Animated.Text>` so the entrance fade and
 *   translateY animate the whole paragraph as one block. Inner
 *   `<Text>` children naturally inherit color, fontSize,
 *   lineHeight, and letterSpacing from the parent — we only have
 *   to redeclare `fontFamily` per emphasis variant. A flat array
 *   of {text, bold?, italic?} segments maps perfectly to this.
 *
 * Parsing strategy (single regex pass, longest-match-first):
 *   The combined regex below alternates `***...***`, `**...**`,
 *   `*...*` in order so the engine prefers triple over double
 *   over single. The body of each marker is matched with `[^*]+?`
 *   (non-greedy, no internal asterisks) which keeps the
 *   implementation simple and matches every authored use in the
 *   sermon catalog — the editorial style guide explicitly forbids
 *   nesting an emphasis mark inside another (a confusing visual
 *   anyway: bold inside italic blurs into a mid-weight wobble
 *   that doesn't read as either).
 *
 * Robustness:
 *   • An odd / unmatched `*` falls through the regex and renders
 *     as a literal asterisk. The reader sees a tiny visual blip;
 *     nothing crashes.
 *   • Empty markers (`**` followed by `**`) are not matched
 *     (the body group requires at least one non-`*` character)
 *     so they pass through as literal asterisks too.
 *   • The parser is pure / synchronous / allocation-light, so it
 *     is safe to call from a `useMemo` per paragraph on every
 *     panel render without measurable cost.
 */
export type EmphasisSegment = {
  text: string;
  bold?: boolean;
  italic?: boolean;
};

// Order matters: longest marker first so the engine consumes
// `***x***` as bold+italic instead of as `*` + `**x**` + `*`.
const EMPHASIS_RE =
  /\*\*\*([^*]+?)\*\*\*|\*\*([^*]+?)\*\*|\*([^*]+?)\*/g;

export function parseInlineEmphasis(input: string): EmphasisSegment[] {
  // Fast path — most paragraphs have zero markers. Skip the
  // regex walk entirely and return a single plain segment so
  // the caller doesn't pay per-paragraph parse cost on
  // unemphasized prose.
  if (!input.includes("*")) {
    return [{ text: input }];
  }

  const segments: EmphasisSegment[] = [];
  let cursor = 0;
  // Reset stateful regex — `g`-flagged regexes carry lastIndex
  // across calls if the same object is reused (which it is,
  // since EMPHASIS_RE is module-level).
  EMPHASIS_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = EMPHASIS_RE.exec(input)) !== null) {
    if (match.index > cursor) {
      segments.push({ text: input.slice(cursor, match.index) });
    }
    if (match[1] !== undefined) {
      segments.push({ text: match[1], bold: true, italic: true });
    } else if (match[2] !== undefined) {
      segments.push({ text: match[2], bold: true });
    } else if (match[3] !== undefined) {
      segments.push({ text: match[3], italic: true });
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < input.length) {
    segments.push({ text: input.slice(cursor) });
  }
  // Pathological input (e.g. a single lone `*`) leaves the
  // segments array empty after the regex pass — fall back to the
  // raw string so we never render nothing.
  return segments.length > 0 ? segments : [{ text: input }];
}
