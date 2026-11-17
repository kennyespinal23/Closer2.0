/* Christian Theology experiences: their instruments' own labels. Passages, Page's lines and each lesson's teaching are
   in content/theology-*.ts. */
export const theology = {
  continue: "Continue",

  // Praying to the Trinity (lesson/blocks/Theology.tsx)
  // the Jordan at evening: find what the verse names
  jordan: {
    // {n}, {total}: numbers
    findCount: "Find what the verse names · {n} of {total}",
    sceneLabel: "The Jordan river at evening: the sky opening above, a dove, and rings spreading on the water",
    // the three places to tap, before they're found (screen readers)
    spots: { father: "The opened heavens", spirit: "The dove", son: "The water" },
  },
  // collecting phrases from passages
  clues: {
    back: "Back to the passages",
    // {n}, {total}: numbers
    found: "Clues found · {n} of {total}",
    // the dots on each passage (screen readers). {n}, {total}: numbers
    dots: "{n} of {total} clues",
  },
  // building the Shield of the Trinity
  shield: {
    // a card when two persons are pulled apart. {a}, {b}: names like "The Father" and "the Son"
    isNot: "{a} is not {b}",
    // {n}, {total}: numbers
    connect: "Connect each one · {n} of {total}",
    tapLines: "Tap the lines between them · {n} of {total}",
    shieldLabel: "Three circles around one: the Father, the Son and the Holy Spirit, each joined to God in the middle",
    // the button on each line between two persons, and once tapped. Shown in capitals; keep it short
    isNotShort: "is not",
    // the word on each line from a person to God in the middle. Shown in capitals; keep it short
    isShort: "is",
    // screen readers. {a}, {b}: the two persons
    pairDone: "{a} is not {b}",
    pairLine: "The line between {a} and {b}",
    // the card shown when a person is joined to God, and the same for screen readers. {name}: a person
    isGod: "{name} is God",
    connectTo: "Connect {name} to God",
  },
  // common misreadings, checked against Scripture
  misreads: {
    // {n}, {total}: numbers
    checkEach: "Check each one · {n} of {total}",
    // over each misreading's title, as in "Is it… three gods?"
    isIt: "Is it…",
    tap: "Tap to check it against Scripture",
  },

  // What Happened on the Cross? (lesson/blocks/Atone.tsx)
  // a road through Scripture, then threads pulled back to what each moment echoes
  path: {
    // {n}, {total}: numbers
    walk: "Walk the path · {n} of {total}",
    pull: "Pull each thread back · {n} of {total}",
    pathLabel: "A path through Scripture: three stations before Jesus, then three in his life",
    // the two halves of the road; shown in capitals
    before: "PATTERNS AND PROMISES",
    jesus: "IN JESUS’ LIFE",
    // a station for screen readers. {label}: the station; {book}: where it is in the Bible
    stationLabel: "{label}, {book}",
    how: "Drag from a coral station up to the gold one it echoes. Or tap one, then the other.",
  },
  // two cliffs and a gap
  bridge: {
    look: "Look at the other side",
    keep: "Keep watching",
    // {n}, {total}: numbers
    tryCross: "Try to cross · {n} of {total}",
    cliffsLabel: "Two cliffs with a gap between them: our side on the left, God’s on the right",
    us: "Us",
    god: "God",
  },
  // lenses on the cross
  lenses: {
    // {n}, {total}: numbers
    lookEach: "Look through each lens · {n} of {total}",
  },

  // Free Will and God’s Knowing (lesson/blocks/FreeWill.tsx)
  // a weekend story with three forks
  freewill: {
    // the path picture for screen readers. {n}: choices made so far
    pathLabel: "Your path: {n} of 3 choices made",
    // {n}: which choice this is
    yourChoice: "Your choice · {n} of 3",
    left: "Left fork",
    right: "Right fork",
    chosen: "The path you chose",
    // each choice in the list. {n}: its number; {option}: what they chose
    chosenItem: "{n}. {option}",
  },
  // replaying the choices, then asking which way knowing and choosing run
  replay: {
    flipAsk: "Now: which way does the arrow point?",
    drag: "Drag the replay to the end",
    // {n}: arrows tried so far
    tryBoth: "Try both arrows · {n} of 2",
    // a small "recording" label on the replay screen
    replay: "Replay",
    start: "The start of your weekend.",
    // {n}: the choice's number; {option}: what they chose (shown in gold)
    choice: "Choice {n}: {option}",
    sliderLabel: "Replay: drag to move through your choices",
    startEnd: { start: "Start", end: "End" },
    question1: "Watching the replay, you know every choice.",
    question2: "Does knowing make them happen?",
    yourChoices: "Your choices",
    knowing: "Knowing them",
    arrowKnow: "Arrow from your choices to knowing them",
    arrowCause: "Arrow from knowing to your choices, crossed out",
    // {because} is the word below, in italics
    follows: "You know them {because} you chose them. The knowing follows the choosing.",
    because: "because",
  },
  // weighing passages on a balance: God's side and ours
  both: {
    // Page, when a passage goes on the other side. {say}: his explanation
    again: "Look again. {say}",
    godSide: "That’s God’s side.",
    humanSide: "That’s the human side.",
    // {n}, {total}: numbers
    weigh: "Weigh each passage · {n} of {total}",
    tapBoth: "Tap both threads",
    // {g}, {h}: how many passages on each side
    balanceLabel: "A balance: {g} passages on God’s side, {h} on ours",
    // the two buttons. {side}: the side's name, from the lesson
    toGod: "← {side}",
    toHuman: "{side} →",
  },
  // five Christian views drawn on one timeline
  views: {
    timelineLabel: "A timeline from past to future, with your choice ahead of now",
    // the timeline's three marks; shown in capitals
    past: "PAST",
    now: "NOW",
    future: "FUTURE",
    // small labels drawn on the timeline under different views
    desires: "your desires",
    sees: "sees what you’ll do",
    // two lines: "the world / God makes"
    world: "the world",
    makes: "God makes",
    allTime: "all of time at once",
    open: "open possibilities",
    // {n}, {total}: numbers
    lookEach: "Look through each lens · {n} of {total}",
    tabsLabel: "Christian views",
    pick: "Pick a lens to see the timeline through it",
    worth: "Worth knowing",
    minority: "Minority view",
    // labels at the start of two lines; the view's text follows
    heldBy: "Held by",
    hard: "The hard question",
  },
  // turning over cards of worries
  stakes: {
    // {n}, {total}: numbers
    turnEach: "Turn each one over · {n} of {total}",
    tap: "Tap to turn it over",
  },

  // Who Is the Holy Spirit? (lesson/blocks/Spirit.tsx)
  // three windows onto three scenes, then the person behind them
  spirit: {
    openAnother: "Open another window.",
    close: "Close the window",
    back: "Back to the windows",
    stepBack: "Step back",
    // {n}, {total}: numbers
    openEach: "Open each window · {n} of {total}",
    // the dove at the Jordan
    doveLabel: "The Jordan: the heavens open above, and a dove comes down toward the water",
    guide: "Or tap to guide it down",
    // the upper room, the night before the cross
    night: "Jesus, the night before the cross",
    // Pentecost: hold to let the wind rise. Page's three lines as it happens
    wind: "A sound like a mighty wind, filling the house.",
    fire: "Then fire. Resting on each one of them.",
    languages: "And they speak, in languages they never learned!",
    roomLabel: "A room in Jerusalem, people gathered together",
    rising: "The wind is rising…",
    still: "Fifty days after Passover. Jesus’ friends are together in one place in Jerusalem.",
    crowd: "What the crowd said",
    // the gauge and its two steps
    // {n}, {total}: numbers
    whatDoes: "What does the Spirit do? · {n} of {total}",
    tapMarked: "Tap the marked words · {n} of {total}",
    // the gauge for screen readers. {n}, {total}: numbers; {end}: the word at the end it's closer to
    gaugeLabel: "{n} of {total}: closer to {end}",
  },
};
