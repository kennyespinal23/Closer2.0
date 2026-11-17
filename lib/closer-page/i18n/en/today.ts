/* Today, the sheet behind Tomorrow, the splash, and a past day opened from Saved. */
export const today = {
  // greeting at the top of Today; {name} is the first name they gave, if any
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  hello: "{part}, {name}.",
  helloNoName: "{part}.",
  // follows the greeting on the same line
  ask: "Got a few minutes?",
  // small caps label on the card; {shelf} is the category name
  cardLabel: "Today · {shelf}",
  // screen-reader name for Page on the card
  pageLabel: "Page, your guide",
  // length of an experience; {n} is minutes
  minutes: "{n} min",
  begin: "Begin",
  again: "Go again",
  tomorrowLabel: "Tomorrow · {shelf}",

  tomorrow: {
    // screen-reader name of the sheet; {title} is tomorrow's experience
    dialog: "Tomorrow: {title}",
    // under the card: {ref} is the first passage, {n} minutes
    meta: "{ref} · {n} min",
    notYet: "Not yet. It opens at midnight.",
    // screen-reader version of the countdown; {hours} and {minutes} come from the plurals below
    opensIn: "Opens in {hours} {minutes}",
    hours: { one: "{n} hour", other: "{n} hours" },
    minutesLeft: { one: "{n} minute", other: "{n} minutes" },
    // under the countdown digits, very short
    unitHours: "hours",
    unitMin: "min",
    unitSec: "sec",
    // {time} is like 7:00
    remindOn: "I’ll remind you at {time}",
    remindOff: "Remind me at {time}",
    okay: "Okay",
  },

  splash: {
    // fades in under the Closer wordmark while the app opens
    line: "The Lord is always closer than you think.",
  },

  recap: {
    close: "Close",
    // screen-reader name: {title}, {date}
    dialog: "{title}, {date}",
    // under the title: {refs} passages, {n} minutes, then optionally {more}
    meta: "{refs} · {n} min{more}",
    more: { one: " · and {n} more that day", other: " · and {n} more that day" },
    again: "Go again",
    // Bible Mysteries: the case file; {id} like 004, {status} like Solved or Filed
    caseLine: "Case {id} · {status}",
    caseFiled: "Filed",
    // the stamp on the file; {date} like NOV 14
    reviewed: "Reviewed {date}",
    caseUnder: "The case you looked into. What Scripture says, what history adds, and what nobody knows.",
    // {n} is the psalm's number
    psalm: "Psalm {n}",
    testimonyUnder: "A life, told carefully from the record.",
    // Misconceptions: label above the struck-through saying, and its stamp
    peopleSay: "People say",
    checked: "Checked",
    // Big Questions: three words floating around a big question mark (decoration, any order reads)
    answers: ["Several", "faithful", "answers"],
    // Learning to Pray: the seal on the folded prayer card (fits a small circle)
    amen: "Amen",
    everydayUnder: "An ordinary moment, with faith in it.",
    storyUnder: "A story you walked through, one scene at a time.",
  },
};
