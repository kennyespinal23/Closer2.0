/* The Closer app's own native screens (~/Closer2.0): tabs, settings, sheets. The lesson web view uses the other areas.
   Nested by screen. {slots} are filled in by the app; keep them exactly as they are. */
export const native = {
  /** the tab bar: one short word each, it has very little room */
  tabs: { today: "Today", bible: "Bible", explore: "Explore", community: "Community", you: "You" },

  today: {
    /** small caps above the greeting: {weekday} is "Monday", {date} is "November 16" */
    dateLine: "{weekday} · {date}",
    /** the big greeting, by time of day */
    morning: "Morning. Got a few minutes?",
    afternoon: "Afternoon. Got a few minutes?",
    evening: "Evening. Got a few minutes?",
    /** VoiceOver, on the flame */
    streakA11y: { one: "{n} day streak. Open your streak", other: "{n} day streak. Open your streak" },
    /** above the day's title: {shelf} is the category, like "Bible Mysteries" */
    todayFrom: "Today · {shelf}",
    /** a chip on the card: how long it takes */
    minutes: "{n} min",
    begin: "Begin",
    /** the same button once they've finished it */
    again: "Go again",
    tomorrowFrom: "Tomorrow · {shelf}",
    tomorrowA11y: "Tomorrow: {title}",
    tomorrowHint: "Shows when it opens",
  },

  /** Page, the red book who guides every lesson. "Page" is his name; keep it as it is. */
  page: { label: "Page, your guide" },

  /** the sheet that slides up when they tap Tomorrow on Today: tomorrow's story sealed in a letter */
  tomorrow: {
    close: "Close",
    letterA11y: "Sealed letter. Opens at midnight.",
    letterHint: "Not yet",
    from: "Tomorrow · {shelf}",
    /** {passage} like "John 11", {n} minutes */
    meta: "{passage} · {n} min",
    waiting: "A letter waiting for you. It opens at midnight.",
    opensIn: "Opens in {h} hours {m} minutes",
    /** tiny caps under the countdown digits */
    hours: "hours",
    min: "min",
    sec: "sec",
    /** {time} is the reminder time, like "7:00" */
    remindMe: "Remind me at {time}",
    reminderSet: "I’ll remind you at {time}",
    reminderSetA11y: "Reminder set for {time}. Tap to cancel.",
    notificationsOff: "Notifications are off for Closer.",
    /** a link that opens the phone's Settings */
    turnOn: "Turn them on in Settings",
    okay: "Okay",
    /** the notification next morning; {title} is the story's title. Written in the language chosen when it was set. */
    notification: "Today’s is ready: {title}.",
  },

  you: {
    settings: "Settings",
    /** under the face when they haven't given a name */
    hiFriend: "Hi, friend",
    /** {since} is a month, like "November" (or "November 2025" in an earlier year) */
    since: "With Closer since {since}",
    welcome: "Welcome to Closer",
    /** small caps under the three numbers; the number shows above, so no {n} */
    statStreak: { one: "DAY STREAK", other: "DAY STREAK" },
    statDone: { one: "STORIES DONE", other: "STORIES DONE" },
    statMoments: { one: "MOMENTS", other: "MOMENTS" },
    /** the card of doors: a title and one line under it */
    streak: "Streak",
    /** shown together: "12 days. You came 4 times this week" */
    streakDays: { one: "{n} day.", other: "{n} days." },
    streakWeek: { one: "You came {n} time this week", other: "You came {n} times this week" },
    streakNone: "Finish today’s story to start one",
    days: "Your days",
    daysSub: "Every story you finished",
    verses: "Saved verses",
    versesSub: { one: "{n} to come back to", other: "{n} to come back to" },
    versesNone: "Save one from any story",
    reflections: "Reflections",
    reflectionsSub: "{n} · only on this phone",
    reflectionsNone: "Only on this phone",
    moments: "Bible moments",
    /** {of} is how many there are in all */
    momentsSub: "{n} of {of} found",
    connections: "Connections",
    connectionsSub: { one: "{n} star lit in your sky", other: "{n} stars lit in your sky" },
    connectionsNone: "How your stories link up",
    finished: "Finished",
    viewAll: "View all",
    /** the quiet line at the very bottom, under Page */
    footer: "The Lord is always closer than you think.",
  },

  /** inside a category (app/shelf/[id].tsx): each shelf drawn as the thing it holds */
  shelves: {
    back: "Back to Explore",
    /** VoiceOver on a case file: {id} like "003", {status} like "Solved" */
    caseA11y: "Case {id}: {title}, {status}",
    /** a stamp or tag on something not ready yet (shown in capitals) */
    soon: "Soon",
    /** under a psalm's landscape: {feeling} like "When you feel forgotten", {n} the psalm's number */
    psalmSub: "{feeling} · Psalm {n}",
  },

  /** the card a Bible Books lesson folds up into, shown in Saved */
  bookCard: {
    /** {genre} like "GOSPEL" */
    head: "BOOK CARD · {genre}",
    /** "The Gospel of Mark · 16 chapters"; {chapters} is "chapters" unless the book has its own word */
    meta: "{title} · {n} {chapters}",
    chapters: "chapters",
    structure: "Structure",
    themes: "Themes",
    keys: "Key passages",
  },

  /** what they kept: finished books, cases, threads, psalms, saved verses and private reflections */
  saved: {
    emptyTitle: "Nothing here yet.",
    /** Page is speaking */
    emptyBody: "Finish today’s story, file a case or save a verse, and I’ll keep it here for you.",
    /** the filter chips */
    filters: { All: "All", Books: "Books", Cases: "Cases", Threads: "Threads", Psalms: "Psalms", Verses: "Verses", Reflections: "Reflections" },
    bookA11y: "{title}: book card",
    psalm: "Psalm {n}",
    removeVerse: "Remove {ref}",
    /** small caps heading, then a quieter note beside it */
    reflections: "YOUR REFLECTIONS",
    onlyHere: "· only on this device",
    deleteReflection: "Delete this reflection",
    readAgain: "READ AGAIN",
    open: "Open",
    openA11y: "Open {title}",
    caseA11y: "Case {id}, filed: {title}",
    caseFiled: "CASE {id} · FILED",
  },

  /** the streak page: one big flame with the number inside it */
  streak: {
    close: "Close",
    streakA11y: { one: "{n} day streak", other: "{n} day streak" },
    /** under the big number inside the flame, so no {n} */
    dayStreak: { one: "day streak", other: "day streak" },
    lineStart: "Finish today’s story to light it.",
    lineKeep: "Finish today’s story to keep it going.",
    lineLongest: "Your longest yet. Keep going.",
    lineDayOne: "Day one. That’s how it starts.",
    lineBest: "Your best is {best}. You’re on your way.",
    done: "Done for today",
    keepGoing: "Keep it going",
    /** two letters each, Monday first */
    weekdays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    weekA11y: { one: "This week: {n} days", other: "This week: {n} days" },
    /** {n} is the next day's count */
    tomorrowMakes: "Tomorrow makes {n}!",
    todayMakes: "Today makes {n}!",
    startToday: "Let’s start one today!",
    best: "Best streak",
    allDays: "Days in all",
    rule: "A day counts when you finish a story.",
  },

  /** Community: Closer Shorts (films) across the top, then the prayer wall. The sample prayers and people are preview
      data, not in this list. */
  community: {
    moreFilms: "More films",
    shorts: { one: "{n} shorts", other: "{n} shorts" },
    newTag: "NEW",
    ask: "Ask someone to pray for you",
    wall: "Prayer wall",
    /** a toggle: show everyone's prayers, or just mine */
    everyone: "Everyone",
    mine: "Mine",
    empty: "Your prayers will be here.",
    previewNote: "Community preview · sample prayers. What you add stays on this device.",
    /** "Closer Shorts": "Closer" is the app's name and stays; this is the second word */
    shortsBrand: "Shorts",
    profile: "Your profile",
    comingSoon: "Coming soon",
    /** shown together over the newest film: "NEW FILM now streaming" (in capitals) */
    newFilm: "New film",
    streaming: "now streaming",
    shortN: "Short {n}",
    watch: "Watch",
    opening: "Opening…",
    watchA11y: "Watch {title}",
    soonA11y: "{title}: coming soon",
    about: "About {title}",
    /** on a reading group's cover */
    reading: { one: "{n} reading", other: "{n} reading" },
    yours: "Yours",
    /** VoiceOver on a prayer, followed by its text */
    prayerFromYou: "Prayer from you.",
    prayerFrom: "Prayer from {name}.",
    /** your name when you haven't given one */
    you: "You",
    /** a prayer posted a moment ago */
    now: "Now",
    /** the little tag on a prayer; "Request" isn't shown */
    tags: { Answered: "Answered", Praise: "Praise" },
    /** after how long ago it was posted: "2h · 5 praying", or "2h · you and 4 praying" once you've prayed */
    praying: { one: " · {n} praying", other: " · {n} praying" },
    youAndPraying: { one: " · you and {n} praying", other: " · you and {n} praying" },
    youPrayed: "You prayed",
    prayForYourself: "Pray for yourself",
    prayFor: "Pray for {name}",
    pray: "Pray",
    prayed: "Prayed",
  },

  /** asking for prayer: you type straight into a preview of your card */
  ask: {
    cancel: "Cancel",
    title: "What can we pray for?",
    titleGroup: "Ask the group to pray",
    inputA11y: "Your prayer request",
    placeholder: "What’s on your heart?",
    preview: "This is how it looks",
    /** {group} is the group's name */
    previewGroup: "{group} sees it like this",
    private: "Keep my name private",
    privateSub: "Shows as “A friend”",
    previewNote: "Community is a preview for now. Your request is saved on this device and isn’t sent to anyone yet.",
    send: "Ask for prayer",
    /** after sending */
    sent: "Your prayer is up",
    sentGroup: "Shared with {group}",
    sentBody: "You won’t carry this one alone. Add an update any time.",
    back: "Back to Together",
    backGroup: "Back to the group",
  },

  /** one prayer request, as a full page in the asker's colour */
  prayer: {
    back: "Back",
    /** {name} is the person's first name, or "them" when they asked anonymously */
    them: "them",
    remove: "Remove prayer",
    removeTitle: "Remove prayer?",
    removeBody: "This removes your prayer from this device.",
    cancel: "Cancel",
    removeConfirm: "Remove",
    /** {age} is a short time like "20m" or "2h" */
    askedNow: "Asked just now",
    askedAgo: "Asked {age} ago",
    askedGroupNow: "Asked the group just now",
    askedGroupAgo: "Asked the group {age} ago",
    youAndOthers: { one: "You and {n} others prayed", other: "You and {n} others prayed" },
    onWall: "On the prayer wall",
    beFirst: "Be the first to pray",
    praying: { one: "{n} person is praying", other: "{n} people are praying" },
    fromChapter: "FROM THIS WEEK’S CHAPTER",
    /** shown in capitals once you prayed */
    willSee: "{name} will see",
    youPrayedFor: "{name} prayed for you. Nothing else is shared.",
    couldSay: "A PRAYER YOU COULD SAY",
    /** a short prayer offered for someone else; {name} as above */
    prayerText: "Lord, be near to {name} tonight. Hold what they’re carrying, and give them your peace.",
    yourNote: "YOUR NOTE",
    noteFor: "A note for {name}",
    saveNote: "Save note",
    sendNote: "Send {name} a note",
    yourUpdate: "YOUR UPDATE",
    updateA11y: "Prayer update",
    updatePlaceholder: "How is it going?",
    answeredA11y: "Answered prayer",
    saveUpdate: "Save update",
    /** the press-and-hold button */
    hold: "Hold to pray",
    holdHint: "Press and hold",
    keepHolding: "Keep holding",
  },

  /** a reading group's page */
  group: {
    back: "Back",
    /** "John 3 of 21 · Reads daily" */
    where: "{book} {chapter} of {of} · {schedule}",
    thisWeek: "This week",
    prayerTab: "Prayer",
    prayerTabN: "Prayer · {n}",
    readA11y: "Read {book} {chapter}",
    thisWeekCaps: "THIS WEEK",
    question: "THIS WEEK’S QUESTION",
    ask: "Ask the group to pray",
    noPrayers: "Nothing yet. When someone asks, it shows up here for the whole group.",
    leave: "Leave group",
    join: "Join this group",
    previewNote: "Local preview. Invitations and live discussion aren’t available yet.",
    answerA11y: "Your answer",
    answer: "Add your answer",
    share: "Share answer",
  },

  /** your groups, on You */
  groups: {
    title: "Your groups",
    reading: { one: "{n} reading", other: "{n} reading" },
    start: "Start a group",
    /** on a narrow tile, two lines */
    startTile: "Start a\ngroup",
  },

  /** starting a reading group */
  createGroup: {
    cancel: "Cancel",
    title: "Start a study group",
    who: "WHO IT’S FOR",
    /** each kind of group, and the name it suggests */
    templates: [
      { title: "A partner", name: "Us two" },
      { title: "Family", name: "Our family" },
      { title: "Friends", name: "Friends in John" },
      { title: "Small group", name: "Our Bible study" },
    ],
    book: "ONE BOOK, TOGETHER",
    often: "HOW OFTEN",
    paces: ["Daily", "3 times a week", "Weekly"],
    /** saved with the group and shown on its cover, matching paces */
    schedules: ["Reads daily", "Three times a week", "Meets weekly"],
    name: "Group name",
    /** {pace} is one of paces, in lower case; {n} weeks */
    plan: { one: "{chapters} chapters · {pace} · about {n} week", other: "{chapters} chapters · {pace} · about {n} weeks" },
    create: "Create group",
    made: { one: "{book}, {pace}. About {n} week.", other: "{book}, {pace}. About {n} weeks." },
    madeNote: "Invitations open when Community goes live. For now your group is saved on this device.",
    open: "Open the group",
    /** the first question a new group sees */
    firstQuestion: "What made you want to read {book} together?",
  },

  /** the pages behind You's rows */
  kept: {
    back: "Back",
    titles: { days: "Your days", finished: "Finished", verses: "Saved verses", reflections: "Reflections" },
    saved: "Saved",
    daysEmpty: "Finish today’s story and it’ll be kept here, one day at a time.",
    daysCount: { one: "{n} day", other: "{n} days" },
    /** follows the day count: "12 days · 4 in a row" */
    inARow: { one: " · {n} in a row", other: " · {n} in a row" },
  },

  /** Connections: the night sky where each finished story is a star, linked to the ones it leads to */
  connections: {
    back: "Back",
    title: "Connections",
    counts: "{found} found · {waiting} waiting",
    dark: "Your sky is still dark",
    howFound: "Each story you finish lights a star. Tap a faint one.",
    howNone: "Some stories lead to others. Finish one and its star lights up here.",
    byHand: "Every line here was chosen and checked by hand.",
    close: "Close",
    /** VoiceOver on a star */
    starFound: "{title}. {category}. Finished.",
    starFaint: "A faint star, not found yet. {hook}",
    starFoundHint: "Shows the story",
    starFaintHint: "Shows where it leads",
    /** the sheet a star opens */
    minutes: "{n} min",
    /** {refs} like "Mark 4 · Psalm 107" */
    foundThis: "You found this one. {refs}",
    /** followed by the story's title in bold */
    leadsTo: "Leads to",
    start: "Start",
    openAgain: "Open again",
    notNow: "Not now",
  },

  /** Settings, behind the gear on You. The developer rows (testing builds only) stay in English. */
  settings: {
    back: "Back",
    title: "Settings",
    /** group headings, shown in capitals */
    reading: "Reading",
    translation: "Bible translation",
    /** the name of the English Bible; the Spanish one will have its own name */
    translationName: "World English Bible",
    reminder: "Daily reminder",
    reminderTime: "8:00 AM",
    off: "Off",
    comfort: "Comfort",
    largeText: "Larger Scripture text",
    largeTextSub: "Verses and Page’s words get bigger",
    reduceMotion: "Reduce motion",
    reduceMotionSub: "Page still moves, just less",
    sounds: "Sounds",
    soundsSub: "Quiet when your phone is on silent",
    more: "More",
    all: "All settings",
    privacy: "Privacy",
    clearRow: "Delete what’s stored on this device",
    clearSub: "Finished lessons, saved verses, reflections",
    /** the confirmation */
    clearTitle: "Delete what’s stored on this device?",
    clearBody: "Your finished lessons, saved verses and kept reflections will be removed from this phone. This can’t be undone.",
    cancel: "Cancel",
    delete: "Delete",
  },

  /** the Bible tab's library. Book names and their one-line themes come from the Bible data, not from here. */
  bible: {
    old: "Old Testament",
    new: "New Testament",
    /** a chip; a ✦ is drawn before it */
    path: "Reading path",
    library: "Library",
    findBook: "Find a book",
    leftOff: "Where you left off",
    startHere: "Start here",
    about: "About {book}",
    heroStarted: "Chapter {chapter} of {of} · {read} read",
    heroNew: { one: "{n} chapters · a good first book", other: "{n} chapters · a good first book" },
    keep: "Keep reading",
    start: "Start reading",
    keepA11y: "Keep reading {book}, chapter {chapter}",
    startA11y: "Start reading {book}, chapter {chapter}",
    moments: "Bible moments",
    momentsA11y: "Bible moments, {n} of {of} collected",
    momentsCount: "{n} of {of} collected",
    momentsMore: "Find more as you read.",
    momentsNone: "They’re hidden in the chapters. Read to find them.",
    rowRead: "{n} of {of} chapters read",
    searchA11y: "Search Bible books",
    cancel: "Cancel",
    books: { one: "{n} book", other: "{n} books" },
    searchTitle: "Find your next passage",
    searchHint: "Search all 66 books by name, such as Psalms or John.",
    open: "Open {book}",
    chapters: { one: "{n} chapter", other: "{n} chapters" },
    noMatch: "No books match",
    nothingFor: "Nothing in the canon contains \"{q}\".",
    tryAgain: "Try a different search.",
  },

  explore: {
    title: "Explore",
    /** the search box, and what VoiceOver calls it */
    searchPlaceholder: "A passage, a person, a topic…",
    search: "Search",
    /** {q} is what they typed */
    noResults: "Nothing yet for “{q}”.",
    /** small caps line on a category band: {n} experiences can be played now */
    ready: { one: "{n} READY", other: "{n} READY" },
    comingSoon: "COMING SOON",
  },
};
