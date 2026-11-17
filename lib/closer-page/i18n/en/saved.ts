/* Saved: everything the person kept (You → Saved, and the Saved screen when it stands alone) */
export const saved = {
  title: "Saved",
  empty: {
    title: "Nothing here yet.",
    // Page speaking, warm; under the empty-state title
    body: "Finish today’s story, file a case or save a verse, and I’ll keep it here for you.",
  },
  // the row of filter pills on top; short, they sit side by side
  filters: {
    label: "Show",
    All: "All",
    Books: "Books",
    Cases: "Cases",
    Threads: "Threads",
    Psalms: "Psalms",
    Verses: "Verses",
    Reflections: "Reflections",
  },
  verses: {
    // screen reader label for the bookmark button on a saved verse; {ref} is like "John 11:35"
    remove: "Remove {ref}",
  },
  notes: {
    title: "Your reflections",
    // follows the title on the same line, after a dot
    where: "· only on this device",
    delete: "Delete this reflection",
  },
  readAgain: {
    title: "Read again",
    // button on each finished lesson card; very short
    open: "Open",
  },
  // a closed Bible Mystery, as a filed folder; {id} is the case number like "003". Tiny uppercase label.
  caseFiled: "Case {id} · Filed",
  // on a threads card: how many threads the network has
  threads: { one: "{n} thread", other: "{n} threads" },
  // tiny uppercase label over a psalm's title; {n} is its number
  psalm: "Psalm {n}",
  days: {
    title: "Your days",
    count: { one: "{n} day", other: "{n} days" },
    thisWeek: "This week",
    lastWeek: "Last week",
    // after the category on a day's card, when more than one lesson was finished that day
    more: " · +{n} more",
    // screen reader label for a day; {date} is like "Monday, November 16", {title} the lesson's title
    label: "{date}: {title}",
  },
  heart: {
    title: "Heart to Heart",
    // privacy note: must stay honest that nothing is synced or backed up
    privacy: "Only what you chose to keep. It stays in this browser on this device: not synced, not backed up, never sent anywhere.",
    // headings for each kind of question Page asked; keep them gentle, never like a score
    topics: {
      closeness: "How close you feel to God",
      "on-my-heart": "What’s been on your heart",
      afraid: "What you wanted to tell God",
      prayer: "Your prayer life",
      change: "How things have changed",
    } as Record<string, string>,
    // under a heading when the same question was answered more than once
    times: { one: "{n} time, newest first", other: "{n} times, newest first" },
    // the person's own words, in curly quotes
    quoted: "“{text}”",
    deleteOne: "Delete this reflection",
    deleteForGood: "Delete for good",
    keep: "Keep",
    confirmAll: "Delete every kept reflection? This can’t be undone.",
    deleteAll: "Delete all",
    cancel: "Cancel",
  },
};
