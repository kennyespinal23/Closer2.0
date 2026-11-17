/* The library: finishing an experience turns it into a book (screens/Discovery.tsx), and the books live on the
   My Discoveries shelf in You (screens/Saved.tsx). No points: the book is the reward. */
export const collect = {
  first: {
    // the very first book someone ever collects; warm, a little proud, not loud
    title: "You made your first discovery!",
    // under the title before the reveal; {title} is the experience's name
    finished: "You finished “{title}”.",
    // shown when the hint glows on the closed book; a tap turns it over
    tap: "Tap to turn it over",
    // after the book lands on the shelf
    begun: "Your library has begun.",
    begunSub: "Every experience you finish becomes a book you can open again.",
  },
  short: {
    // a small label over the book, for every new one after the first
    label: "New discovery",
    added: "Added to your library",
  },
  gentle: {
    // after Heart to Heart, poetry and prayer: quiet, no fanfare
    kept: "Kept in your library.",
    sub: "Open it again whenever you need it.",
    begun: "Your library has begun.",
  },
  // the count on the shelf
  books: { one: "{n} book", other: "{n} books" },
  library: "My library",
  home: "Back to Today",
  view: "See it in My Discoveries",
  continue: "Continue",
  done: "Done",
  seeLibrary: "See my library",
  // read by screen readers for the book on screen: "Lazarus, a book from Stories"
  cover: "{title}, a book from {category}",
  // shown only when the testing panel plays the sequence
  preview: "Preview · nothing is saved",
  shelf: {
    title: "My Discoveries",
    // the hint under the shelf
    hint: "Tap a book to read it again.",
    open: "Read “{title}” again",
  },
};
