/* The generic lesson blocks used across many experiences: buttons, hints and small labels. The lesson's own words
   (Page's lines, verses, choices) are lesson content in content/. */
export const blocks = {
  // the main button that moves a lesson on
  continue: "Continue",
  skip: "Skip",

  // Learning to Pray: prompts, the prayer builder, a still moment, a Scripture prayer, letting a prayer go
  prayer: {
    continueWithout: "Continue without writing",
    starterHint: "Tap a starter if it helps. Change anything. Or write your own.",
    private: "Just between you and God. Nothing here is sent or saved.",
    skipMoment: "Skip this moment",
    // shown once the person has been still long enough
    ready: "I’m ready",
    // screen reader name for the breathing circle while it's held
    beingStill: "Being still",
    tapPhrase: "Tap a phrase that stands out to you",
    notScripture: "A prayer you could pray · not Scripture",
    amen: "Amen",
    // small label above the prayer card
    yours: "Your prayer",
    swipe: "Swipe it up, or say Amen, when you’re done",
    released: "Nothing was sent or shared. That prayer is between you and God.",
    kept: "Kept on this device, in Saved",
    keep: "Keep a private copy on this device",
  },

  // "It Is Written": find Jesus' words, then drag them onto the scroll they come from
  written: {
    // Page's hint, when the lesson doesn't give its own
    findHint: "Find it in his words.",
    // {phrase}: the words to find, from the lesson
    lookFor: "Look for “{phrase}”.",
    notQuite: "Not quite. Keep looking.",
    where: "Where is it written?",
    // screen reader name for the dragged phrase
    dragLabel: "{phrase}: put it on the scroll",
    scroll: "The scroll it’s written in",
  },

  // a private journal or prayer moment
  journal: {
    keepAndContinue: "Keep it and continue",
    private: "Private. Saved only on this device, never sent anywhere.",
    prayIt: "Pray it, out loud or quietly",
  },

  // the 40 days in the wilderness: hold to pass the days
  wilderness: {
    // screen reader name for the hold button. {hold}: its label, {n}: the day reached, {days}: 40
    holdLabel: "{hold}. Day {n} of {days}",
    holding: "Day {n}…",
    art: "The wilderness: dunes, three stones, and footprints walking into the distance",
    // the small day counter: this word, then the number, then " / 40". Keep the space at the end if your language needs it
    day: "Day ",
  },

  // a text-message conversation with someone in a life situation
  scenario: {
    // {label}: firstTime, or the lesson's own label; {said}: what the person chose last time
    earlier: "{label} “{said}”",
    firstTime: "The first time, you said:",
    typing: "{name} is typing",
    whatDoYouSay: "What do you say?",
  },

  // an archival document: open it, then zoom in
  artifact: {
    open: "Open it",
    closer: "Look closer",
    openLabel: "Open {title}",
  },

  // pick the feelings that are true
  feelings: {
    // the button once more than one is picked, and once one is picked
    many: "That’s what I’d feel",
    one: "That’s it",
    pickAny: "Pick any that are true",
  },

  // the storm story's sound toggle
  turning: {
    soundOn: "Sound on",
    soundOff: "Sound off",
  },

  // Misconceptions: the claim, crossing it out, what Scripture shows
  myth: {
    claim: "The claim",
    shows: "What Scripture shows",
    investigate: "Let’s investigate",
    // the last line before the investigation starts: a thinking sound
    hmm: "Hmm…",
    anyAnswer: "Any answer works. Let’s look at the evidence.",
    // what kind of misconception it is, and what that means
    type: {
      contradicts: { label: "Contradicts Scripture", means: "The Bible says something different." },
      misattributed: { label: "Popular saying, not a verse", means: "It sounds biblical, but the Bible doesn’t say it." },
      tradition: { label: "Tradition, not in the text", means: "A detail the Bible never actually gives." },
      disputed: { label: "Christians disagree", means: "Faithful readers land in different places on this one." },
    },
  },

  // "Not this … but this": drag the true statement into the slot
  compare: {
    not: "Not",
    but: "But",
    // the empty slot, waiting for the card
    slot: "But…",
    // screen reader name for the draggable card
    place: "Place: {text}",
  },

  // what Scripture teaches and doesn't explain: tiles to turn over
  knowns: {
    revealUnknown: "Reveal what Scripture doesn’t explain",
    revealKnown: "Reveal what Scripture teaches",
    tap: "Tap to reveal",
    turnAll: "Turn them all over",
    // screen reader name of a turned tile. {ref}: its Bible reference
    shown: "{text}, {ref}",
  },
  // a verse with tappable phrases that open a note
  context: {
    // screen reader name. {phrase}: the tapped words, {label}: what they link to
    link: "{phrase}: {label}",
  },

  story: {
    // after sending a message in a story beat
    sent: "Sent.",
  },
  reflection: {
    note: "No wrong answers here.",
  },
  // two truths, side by side, then held together
  both: {
    join: "Hold them together",
  },
  // a person's life then, and what came later
  legacy: {
    later: "See what came later",
  },
  // a back-and-forth between people in a passage
  exchange: {
    next: "Next line",
  },
  verse: {
    saved: "Saved",
    save: "Save this verse",
  },
  // Lazarus: the stone at the tomb
  tomb: {
    roll: "Roll it away",
  },
  // cards with different Christian perspectives
  perspectives: {
    openCard: "Open a card",
    more: "{n} more to open",
  },
  // highlight a phrase in a verse
  highlight: {
    forMe: "Highlight it for me",
    // screen reader name. {verse}: the verse text
    label: "{verse} Swipe across to highlight, or press Enter.",
  },
  read: {
    // the button under a passage to read
    done: "I’ve read it",
  },
  // a life on a timeline: tap each event
  timeline: {
    // {hint}: the lesson's hint, {n}: events still to open
    left: "{hint} ({n} left)",
    tap: "Tap to open",
    // after a big number: "40 years"
    years: "years",
  },
};
