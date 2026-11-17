/* Closer Poetry: the words around the three poems (lesson/blocks/PoemLoved, PoemFar, PoemToday). The poems themselves
   are in content/poem-*.ts and should be rewritten as Spanish poems, not translated line by line. */
export const poetry = {
  continue: "Continue",
  amen: "Amen",
  // over the prayer at the end of each poem
  pray: "Pray it, out loud or quietly",
  // a toggle at the top of the screen, only where the phone has a voice
  aloudOn: "Reading aloud",
  aloud: "Read aloud",
  // screen-reader name for tapping to bring the next line sooner
  nextLine: "Next line",

  /* You Are Still Loved */
  loved: {
    // screen-reader label on the dots that show which verse of the poem you're in
    verse: "Verse {n} of {total}",
    // the breathing moment: shown while breathing in, then out
    breatheIn: "Breathe in…",
    breatheOut: "and out…",
    aPoem: "A poem",
    fromPoem: "From the poem",
    scripture: "Scripture · {ref}",
    opened: "{n} of {total} opened",
  },

  /* When I Feel Far Away */
  far: {
    begin: "Begin",
    letGo: "Let go whenever you want to stop.",
    series: "Closer Poetry",
    // under the whole poem: the Bible passages it leans on, and the Bible they're quoted from
    refs: "{refs} · World English Bible",
  },

  /* Thank You for Today */
  today: {
    more: { one: "Pick {n} more", other: "Pick {n} more" },
    // "3 of 5 · Nothing you pick is saved."
    count: "{n} of {max} · {privacy}",
    add: "Add",
    cancel: "Cancel",
    showAll: "Show the whole poem",
    stop: "Stop reading",
    readIt: "Read it aloud",
    // joining the things you picked inside the prayer: "the light, a good meal and a friend"
    sep: ", ",
    and: "{items} and {last}",
    // used in the prayer if nothing was picked: "thank you for today"
    nothing: "today",
  },
};
