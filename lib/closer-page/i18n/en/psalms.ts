/* Psalms & Emotions: the pieces of a psalm experience (lesson/blocks/Psalms.tsx). The psalm's words, phrases and
   Page's lines are lesson content in src/content/. Tone: quiet and gentle; nothing asks anyone to feel better. */
export const psalms = {
  continue: "Continue",
  // a passage reference: {n} the psalm's number, {verses} a verse or range ("1–2")
  ref: "Psalm {n}:{verses}",
  psalm: "Psalm {n}",
  // short verse marks beside quoted words
  verse: "v{n}",
  verses: "v{from}–{to}",
  // the small line under a passage: "Psalm 13:1–2 · World English Bible"
  source: "{ref} · {translation}",
  text: {
    // screen-reader label for a phrase you can touch: {text} the words, {name} what it is
    phraseAria: "{text}: {name}",
    hingeAria: "{text}: the turn in the psalm",
  },
  meet: {
    // the label on the opening lines Page reads aloud
    begins: "How Psalm {n} begins",
  },
  touch: {
    few: "Touch a few phrases",
    ready: "Continue when you’re ready",
    unsaved: "Nothing here is saved.",
    unsavedLong: "You don’t need to answer. Nothing here is saved.",
    sit: "Sit with that for a moment",
  },
  carry: {
    listen: "Listen to what he asks.",
    button: "Carry it to God",
    oneOrTwo: "Touch a phrase or two",
    aria: "The earlier verses. Drag them upward, or use the button, to carry them on.",
    drag: "↑ Drag up to carry these words to God",
  },
  shift: {
    show: "Show me",
    // {word}: the word where the psalm turns
    touch: "Touch “{word}”",
    turnTwo: "Turn two of the cards",
    tapTwo: "Tap two cards",
    how: "How the words change · tap a card",
  },
  arc: {
    hint: "Tap any part to read it again.",
    all: "Psalm {n}, all of it",
  },
  quiet: {
    finish: "Finish for today",
    back: "Return when you’re ready",
    doneReading: "Done reading",
    readAgain: "Read Psalm {n} again",
    moment: "Spend a quiet moment",
  },
};
