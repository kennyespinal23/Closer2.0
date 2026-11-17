/* Heart to Heart: the words inside the conversations with Page (lesson/blocks/HeartClose, HeartLately, HeartAfraid)
   and how Page says when something was kept (heart.ts). The lessons' own lines are in content/heart-*.ts.
   These are intimate, gentle words: rewrite them naturally, don't translate word for word. */
export const heart = {
  continue: "Continue",
  amen: "Amen",
  // under a box you're writing in, before anything is kept
  notYet: "Nothing is kept yet. You’ll choose next.",
  continueEmpty: "Continue without writing",

  /* how Page says when you said something; used inside sentences like "Last week, you told me…"
     (the first letter is capitalised automatically when it starts a sentence) */
  when: {
    today: "earlier today",
    yesterday: "yesterday",
    days: { one: "{n} day ago", other: "{n} days ago" },
    lastWeek: "last week",
    weeks: { one: "{n} week ago", other: "{n} weeks ago" },
    month: "about a month ago",
    // whole phrases for 2 to 12 months, so each can read naturally; past a year, "months" is used
    byMonths: {
      2: "about two months ago",
      3: "about three months ago",
      4: "about four months ago",
      5: "about five months ago",
      6: "about six months ago",
      7: "about seven months ago",
      8: "about eight months ago",
      9: "about nine months ago",
      10: "about ten months ago",
      11: "about eleven months ago",
      12: "about twelve months ago",
    },
    months: "about {n} months ago",
  },

  /* How Close Do You Feel to God? */
  close: {
    road: "A road at dusk leading to a house with its porch light on. Your lantern shows where you are.",
    // screen-reader names of the places you can tap in the picture
    spots: { porch: "porch", road: "road", far: "far", fog: "fog" },
    lantern: "Your lantern. Drag it to where you are",
    // the label under your lantern; keep it very short
    you: "YOU",
    // put after "Hi" when we know a first name: "Hi, Ana."
    name: ", {name}",
    // if there's no earlier date to name: "what would you say to yourself from then?"
    then: "then",
    letterNote: "Just for you. Nothing is kept unless you choose to, at the end.",
    noWrong: "No wrong answers. Nothing here is scored.",
    // saved with the reflection, shown again in You → Saved
    question: "Where are you on the road home today?",
    sinceQuestion: "How have things been since last time?",
    kept: "What would be kept",
  },

  /* What's Been on Your Heart Lately? */
  lately: {
    // what a quiet day is kept as, and shown as
    quiet: "Nothing much today",
    quietBasket: "Nothing much today, and that’s fine.",
    // joining a few things: "work, my mum and sleep"
    sep: ", ",
    and: "{items} and {last}",
    andMore: "{first} and more",
    fewThings: "a few things",
    // something you named yourself, quoted back
    quoted: "“{text}”",
    setDown: "Set it down",
    hold: "Hold to hand them over",
    // these must match words in the verse exactly, so they can light up (1 Peter 5:7, Philippians 4:6)
    litCast: "because he cares for you",
    litPeace: "with thanksgiving",
    done: "Done writing",
    prayLabel: "Pray it, or pray it your own way",
    onlyIf: "Only if you want",
  },

  /* Is There Something You've Been Afraid to Tell God? */
  afraid: {
    // Page, when you come back; {When} is "Last week" and so on
    back: "{When}, you told God something hard.",
    noWriting: "You didn’t write anything down.",
    noNeed: "You don’t have to say anything about it.",
    show: "Show me",
    more: "And then?",
    ready: "I’m ready",
    // one short line for each of the three passages, in order (Psalm 139, Psalm 62, Hebrews 4)
    sums: ["He already knows you, all the way through.", "He invites you to pour out your heart.", "He welcomes you close, with boldness."],
    // Page, once the slip is folded
    prayHolding: "If you’d like, pray it while you hold.",
    holding: "Keep holding…",
    notSaved: "Nothing is saved while you write.",
    prayIf: "Pray it, if you’d like",
    before: "Before I keep anything",
    keptNote: "Kept privately on this device. Delete it any time in You → Saved.",
    notKept: "Nothing from this was kept.",
  },
};
