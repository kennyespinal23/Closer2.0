/* The lesson player around every experience: its header, the shared layout, and the end screens */
export const lesson = {
  // header buttons (read by screen readers only)
  close: "Close",
  back: "Back",
  // screen reader name for tapping the story to move on
  continue: "Continue",

  // the small pill on a testimony or Gospel claim, saying what kind of claim it is.
  // he / she / they: the person the lesson is about
  tag: {
    fact: "Documented",
    own: { he: "In his own words", she: "In her own words", they: "In their own words" },
    account: { he: "From his own telling", she: "From her own telling", they: "From their own telling" },
    legend: "Later legend",
    interpretation: { he: "How he understood it", she: "How she understood it", they: "How they understood it" },
    disputed: "Historians differ",
    text: "In the text",
    context: "Historical context",
    reading: "A common reading",
  },

  // the last screen of a lesson
  complete: {
    backToToday: "Back to Today",
    finish: "Finish",
    // {ref}: a Bible reference, like "John 11:35"
    todaysVerse: "Today’s verse · {ref}",
    sources: "Sources",
    keepExploring: "Keep exploring",
    // a solved misconception: what people say (crossed out) beside what Scripture shows
    peopleSay: "People say",
    scriptureShows: "Scripture shows",
    evidence: "The evidence",
    // what kind of misconception it was
    mythType: {
      contradicts: "Contradicts Scripture",
      misattributed: "Popular saying, not a verse",
      tradition: "Tradition, not in the text",
      disputed: "Christians disagree",
    },
  },

  // after the last screen: one suggested next experience
  related: {
    finishForToday: "Finish for today",
    exploreMore: "Explore more",
    showLess: "Show less",
    // {n}: minutes
    minutes: "{n} min",
    doneBefore: "Done before",
    start: "Start",
    again: "Again",
    // a smaller suggestion: its shelf and length. {category}: a shelf name, like "Big Questions"
    itemMeta: "{category} · {n} min",
    itemMetaDone: "{category} · {n} min · Done",
    // screen reader names. {title}: the experience, {why}: one sentence on how it connects
    itemLabel: "{title}. {category}, {n} minutes. {why}",
    cardLabel: "Open {title}. {category}, about {n} minutes. {why}",
    cardLabelDone: "Open {title}. {category}, about {n} minutes. {why} You've done this one.",
  },
};
