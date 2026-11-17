/* Church History: the words inside the three history experiences (lesson/blocks/HistBible, HistFirst, HistSplit).
   The lessons' own text (Page's lines, the facts, the sources) is in content/history-*.ts. */
export const history = {
  continue: "Continue",

  /* How Did We Get the Bible? */
  bible: {
    // how sure a note is; shown as a small uppercase chip
    tags: { record: "In the record", estimate: "Scholars’ estimate", debated: "Still debated" },
    copy: {
      // Page, once the copy is finished
      copied: "One copy, by hand. Now send it out.",
      // Page, as copies spread; {n} copies in {cities} cities
      spreading: { one: "{n} copies, in {cities} city.", other: "{n} copies, in {cities} cities." },
      holding: "Keep holding to copy",
      hold: "Hold to copy by hand",
      send: "Send a copy to another church",
      // {n} is how many copies there are now
      again: "Each church copies it again · {n}",
      compare: "Compare three copies",
      findSlip: "Find the slip",
      original: "The page in front of you",
      yours: "Your copy",
      everyOne: { one: "{n} copy, every one by hand", other: "{n} copies, every one by hand" },
      // label on each of three copies; {city} is a city name
      from: "Copy from {city}",
    },
    witness: {
      // years on the time strip; {y} is a number
      bc: "{y} BC",
      ad: "AD {y}",
      progress: "Go back in time · {n} of {total}",
      drag: "Drag back in time",
      year: "Year",
      // screen-reader label for a manuscript on the strip
      dot: "{name}, {date}",
      none: "Nothing older yet. Keep going back.",
    },
    sort: {
      progress: "Sort the writings · {n} of {total}",
      ask: "Where did the church put it?",
      done: "Every writing sorted.",
    },
    list: {
      // Page
      tests: "How did they know? Open the three tests.",
      holding: "Keep holding",
      hold: "Hold to unroll the letter",
      progress: "Open the tests · {n} of {total}",
      letter: "Festal Letter 39 · AD 367",
      tap: "Tap to open",
    },
    shelves: {
      progress: "Look at each shelf · {n} of {total}",
      tap: "Tap to look",
      shared: "Shared by all three",
      extra: "Also in this Bible",
    },
  },

  /* What Happened to the First Christians? */
  first: {
    tags: { text: "In Scripture", record: "Historical record", tradition: "Early tradition", estimate: "Rough estimate" },
    map: {
      progress: "Tap the glowing city · {n} of {total}",
      // screen-reader label on the next city
      go: "Go to {city}",
    },
    docs: {
      progress: "Find every clue · {n} of {total}",
      tabs: "Documents",
      allFound: "all clues found",
      // stamp on the letter: the Roman text is paraphrased, not quoted
      paraphrased: "Paraphrased",
      found: "{text}: clue found",
      clue: "Clue: {text}",
      tellsMaybe: "What it may tell us · a common reading",
      tells: "What it tells us",
    },
    years: {
      scope: { local: "One place, for a time", empire: "Empire-wide", peace: "Freedom to worship" },
      progress: "Slide through the years · {n} of {total}",
      // small "AD" before the big year number
      ad: "AD ",
      year: "Year",
      // screen-reader value: "AD 64: The fire in Rome"
      value: "AD {year}",
      valueWith: "AD {year}: {label}",
      none: "Drag through the years, from left to right.",
      finding: "What the record shows",
    },
    grow: {
      holdLabel: "Hold to watch the church grow",
      grown: "Grown",
      hold: "Hold · AD {year}",
      progress: "Open each witness · {n} of {total}",
      open: "Open",
      ad: "AD ",
      // the running estimate; {n} is "1.2 million" or "40,000"
      million: "{n} million",
      people: "Christians, roughly",
      finding: "Why it spread",
    },
  },

  /* Why Did Christianity Split? */
  split: {
    families: {
      oriental: { name: "Oriental Orthodox", where: "Coptic, Ethiopian, Armenian, Syriac" },
      orthodox: { name: "Orthodox", where: "The East: Greek, Russian, Serbian…" },
      catholic: { name: "Catholic", where: "The West, with the bishop of Rome" },
      protestant: { name: "Protestant", where: "Lutheran, Reformed, Anglican, Baptist…" },
    },
    river: {
      label: "The church's river, at the year {year}",
      // Page, on reaching today
      today: "And here we are today.",
      drag: "Drag to today",
      title: "The church, AD 30 to today",
      ad: "AD {year}",
      // last tick on the river
      now: "Now",
      todayTitle: "Today",
      estimate: "Estimate: {source}",
    },
    threads: {
      go1054: "Go to July 1054",
      progress: "Threads inspected · {n} of {total}",
      goTo: "Go to {year}",
      east: "The East",
      west: "The West",
      eastWhere: "Constantinople · Greek",
      westWhere: "Rome · Latin",
      // small headings over the two sides of one thread
      eastShort: "East",
      westShort: "West",
    },
    door: {
      deeper: "Two deeper questions",
      tap: "Tap the door",
      next: "Next question",
      hearAll: "Hear all three",
      post: "Post the theses on the door",
      where: "Wittenberg · 31 October 1517",
      question: "Question {n} of {total}",
      heard: "✓ heard",
      hear: "Tap to hear",
      // {family} is a family's name, e.g. Orthodox
      asTheySay: "As {family} Christians put it",
      leans: "Leans on {refs}",
    },
    shared: {
      // Page, as sheets are laid on the light table
      first: "{family} beliefs. Now add another.",
      second: "See which ones line up?",
      all: "All three. {n} beliefs line up exactly.",
      prayed: "Jesus prayed about this very thing.",
      progress: "Sheets laid · {n} of 3",
      paul: "And Paul wrote",
      onTable: "On the table",
      jesus: "Jesus prays, the night before the cross",
      ephesus: "Paul to the church in Ephesus",
    },
  },
};
