/* Bible Books: the pieces of a book overview (lesson/blocks/Book.tsx). The book's own facts, sections and Page's lines
   are lesson content in src/content/. Small-caps labels are shown uppercase by the design. */
export const books = {
  /* the kind of book, shown on its cover and card */
  genre: {
    gospel: "Gospel", narrative: "Historical narrative", law: "Narrative and law", poetry: "Poetry and song",
    wisdom: "Wisdom", prophecy: "Prophecy", letter: "Letter", apocalyptic: "Apocalyptic prophecy",
  },
  /* what a book's parts are called, by its shape; `plural` follows a count, e.g. "4 movements" */
  shape: {
    arc: { unit: "movement", plural: "movements" },
    collection: { unit: "collection", plural: "collections" },
    argument: { unit: "step", plural: "steps of the argument" },
    visions: { unit: "vision", plural: "visions" },
  },
  // used unless the book names its own (Psalms says "psalms")
  chapters: "chapters",
  /* where a statement about the book comes from */
  tag: { text: "In the text", tradition: "Early tradition", scholarship: "Scholars’ view", overview: "Overview", readings: "Ways it’s read" },
  continue: "Continue",
  cover: {
    open: "Open the book",
    // {chapters}: count + word ("16 chapters"); {sections}: count + part name ("4 movements")
    size: "{chapters} · {sections}",
    count: "{n} {word}",
    swipe: "← Swipe or tap to open",
  },
  facts: {
    hint: "Tap each one.",
    openThree: "Open three",
    opened: "opened",
    labelled: "Facts, early tradition and scholars’ views are labelled apart.",
  },
  unfold: {
    // {units}: the part name in plural ("movements")
    openTwo: "Open two {units}",
    // {book} · {n} {units}
    heading: "{book} · {n} {units}",
    sectionAria: "{title}, {chapters}",
    // {book} {from}–{to}, e.g. "Mark 1:1–8:26"
    span: "{book} {from}–{to}",
  },
  architecture: {
    // {unit}: the part name ("movement")
    openEvery: "Open every {unit}",
    inShort: "In short",
    keyEvent: "A key event",
    passage: "A passage to know",
    whole: "In the whole story",
  },
  pivot: {
    slide: "Slide through the book",
    turn: "The turning point · {ref}",
    before: "Before the turn",
    after: "After the turn",
    // {book}: the book's name
    where: "Where you are in {book}",
  },
  threads: {
    followTwo: "Follow two themes",
    themes: "Themes",
    stopAria: "{label}, {ref}",
    // {n} of {total} · {label}
    stop: "{n} of {total} · {label}",
    back: "← Back",
    next: "Next passage →",
    pick: "Pick a theme to see it run through the book.",
  },
  textual: {
    hint: "Compare the two.",
    both: "Look at both",
    manuscripts: "Manuscripts",
  },
  card: {
    // screen-reader name of the card; {title}: the book's full title
    aria: "{title}: book card",
    kicker: "Book card · {genre}",
    // {title} · {chapters} (count + word)
    meta: "{title} · {chapters}",
    structure: "Structure",
    themes: "Themes",
    keys: "Key passages",
    kept: "Kept in Saved, under Book cards.",
  },
};
