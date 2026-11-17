/* You: the profile tab, its settings, appearance, awards and the streak */
export const you = {
  title: "You",
  settings: {
    title: "Settings",
    reading: "Reading",
    translation: "Bible translation",
    // the name of the Bible translation the app uses; in Spanish, the Spanish Bible's own name
    translationName: "World English Bible",
    reminder: "Daily reminder",
    // shown when no reminder time was chosen
    reminderDefault: "8:00 AM",
    off: "Off",
    look: "Look",
    appearance: "Appearance",
    comfort: "Comfort",
    largeText: "Larger Scripture text",
    largeTextSub: "Verses and Page’s words get bigger",
    reduceMotion: "Reduce motion",
    reduceMotionSub: "Page still moves, just less",
    gettingStarted: "Getting started",
    replay: "Replay the welcome",
  },
  footer: {
    // Page's line at the bottom of You
    line: "The Lord is always closer than you think.",
    build: "Closer · prototype",
  },

  appearance: {
    title: "Appearance",
    done: "Done",
    mode: "Mode",
    // three choices side by side in a segmented control; keep short
    light: "Light",
    dark: "Dark",
    system: "Match my phone",
    note: "Lessons keep their own colours in every mode, so each story looks the way it was made.",
  },

  awards: {
    newAward: "New award",
    continue: "Continue",
    done: "Done",
    close: "Close",
    // header of the awards page (small uppercase)
    header: "Awards",
    title: "Your awards",
    // screen reader label for a locked badge
    locked: "{name}, locked",
    // screen reader label for the award moment; {label} is "New award"
    reveal: "{label}: {name}",
    // screen reader label for the strip on Today and You
    stripLabel: "Your awards: {got} of {total}. {discoveries}.",
    // the strip: "2 of 7 · 5 discoveries"
    strip: "{got} of {total} · {discoveries}",
    discoveries: { one: "{n} discovery", other: "{n} discoveries" },
    books: { one: "{n} book", other: "{n} books" },
    // under the page title: "2 of 7 earned · 5 discoveries · 3 books"
    summary: "{got} of {total} earned · {discoveries} · {books}",
    // the four small stat tiles; very short, two lines at most
    tiles: { streak: "Day streak", longest: "Longest streak", days: "Days explored", experiences: "Experiences" },
    // {date} is like "November 16"
    earned: "Earned {date}",
    // after Page's quote on an earned award
    saidBy: "· Page, {date}",
    // Page's words, in curly quotes
    quoted: "“{say}”",
    soFar: "{have} of {need} so far.",
    footnote: "Awards stay yours, even if a streak ends.",
    // each award: its name, what it takes, and what Page says when you earn it
    list: {
      "it-is-written": { name: "It Is Written", requirement: "Complete “It Is Written”", say: "Your first discovery! You followed Jesus’ words all the way back to where they were written." },
      "first-steps": { name: "First Steps", requirement: "Complete 3 different experiences", say: "You’ve completed your first three discoveries!" },
      "truth-seeker": { name: "Truth Seeker", requirement: "Complete 5 Misconceptions", say: "You’ve explored five Bible misconceptions. Look how much you’ve uncovered!" },
      "curious-mind": { name: "Curious Mind", requirement: "Complete 5 Big Questions", say: "Five big questions. You don’t shy away from the hard ones!" },
      "history-explorer": { name: "History Explorer", requirement: "Complete 5 Bible Mysteries", say: "Five cases opened! You’ve dug through a lot of history." },
      "bible-explorer": { name: "Bible Explorer", requirement: "Explore passages from 10 books of the Bible", say: "You’ve explored Scripture from ten different books of the Bible!" },
      "faithful-explorer": { name: "Faithful Explorer", requirement: "Complete experiences on 7 different days", say: "Seven different days with God’s Word. That’s faithful." },
    },
    // smaller moments Page notices between awards, each said once
    notes: {
      d10: "Ten discoveries! You’ve seen a lot of Scripture for yourself.",
      d25: "Twenty-five discoveries. I love exploring with you.",
      // {book} is the Bible book explored most recently
      b5: "You’ve explored five books of the Bible already. Most recently {book}.",
    },
  },

  streak: {
    header: "Streak",
    close: "Close",
    // screen reader label for the flame chip; {n} is the count
    chip: { one: "{n} day streak", other: "{n} day streak" },
    chipNotYet: { one: "{n} day streak, not extended today yet", other: "{n} day streak, not extended today yet" },
    // under the big number
    unit: { one: "day streak!", other: "day streak!" },
    lit: "You extended your streak today. See you tomorrow!",
    keepAlive: "Do a lesson today to keep your streak alive!",
    start: "Finish a lesson today to start a streak!",
    startLesson: "Start a lesson",
    freeze: "Streak freeze · {have} of {max}",
    freezeNote: "A freeze covers a day you miss, automatically. You earn one every 7 days of streak.",
    nextMilestone: { one: "Next milestone: {n} day", other: "Next milestone: {n} days" },
    toGo: "{n} to go",
    longest: { one: "Longest streak: {n} day", other: "Longest streak: {n} days" },
    practised: { one: "{n} day practised", other: "{n} days practised" },
    // Page, under the calendar
    sameTime: "Same time tomorrow?",
    savedOne: "I saved you a good one today.",
    thisWeek: "This week",
    // one letter per weekday, Monday first (column heads and the week row)
    weekLetters: ["M", "T", "W", "T", "F", "S", "S"],
    // full weekday names, Monday first (screen reader)
    weekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    // screen reader: "{day}: {state}"
    dayLabel: "{day}: {state}",
    states: { done: "done", frozen: "frozen", today: "today", future: "future", missed: "missed" },
    // the moment after the first lesson of the day
    first: "Your streak starts today. Come back tomorrow to keep it going!",
    milestone: "{n} days! That’s a milestone.",
    onFire: "You’re on fire. Come back tomorrow to keep it going!",
    earnedFreeze: "You earned a streak freeze!",
    continue: "Continue",
  },
};
