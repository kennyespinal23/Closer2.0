/* Connections: Pull the Thread (lesson/blocks/Connections.tsx and lesson/connections.ts). The passages, threads and
   Page's lines are lesson content in src/content/. */
export const connections = {
  /* what kind of link a thread is; shown beside a small sample of its line */
  kind: {
    quote: "Direct quotation",
    explicit: "Named in the text",
    theme: "Thematic reading",
  },
  continue: "Continue",
  connect: "Connect for me",
  seeAll: "See the whole pattern",
  // a passage on the plane not found yet
  ghostAria: "A passage not yet found",
  fragmentAria: "{title}, {ref}",
  // a thread between two passages: {from} to {to}, and its {kind}
  threadAria: "{from} to {to}: {kind}",
  pullAria: "Pull the thread from {ref} to find the next passage",
  networkAria: "The network of passages",
  drag: "Drag the glowing thread · or tap it",
  wholePattern: "Whole pattern",
  patternTitle: "The whole pattern",
  lookCloser: "Tap a passage or a thread to look closer.",
  pullHint: "Pull the thread to find where it leads.",
  // a passage reference and its translation
  source: "{ref} · {translation}",
};
