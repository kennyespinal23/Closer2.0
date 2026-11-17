/* The first run (screens/FirstRun.tsx): Page's hello, the first discovery, the save, then name, reminder and Pro.
   And the older questionnaire onboarding (screens/Onboarding.tsx), under `onboarding`. Page is a friendly red book
   who guides the user: warm, short, never pushy. */
export const firstRun = {
  // accessible name for Page, the mascot
  pageLabel: "Page, your guide",
  // shared buttons
  continue: "Continue",
  skip: "Skip",
  notNow: "Not now",
  beenHere: "I’ve been here before",

  hello: {
    title: "Hi, I’m Page!",
    // shown when they left the first lesson part way
    resume: "Your discovery is right where you left it.",
    intro: "I explore the Bible a few minutes at a time. Want to see something surprising?",
    peekLabel: "Your first discovery · 5 min",
    // the title of the first lesson (content/it-is-written.ts)
    peekTitle: "It Is Written",
    start: "Start my first discovery",
    resumeButton: "Pick up where I left off",
  },
  // over the award badge after the first lesson
  awardLabel: "Your first award",

  save: {
    title: "Your first discovery is worth keeping.",
    body: "Create your free account to save what you’ve learned and keep exploring.",
    button: "Save My Discovery",
  },
  // the stand-in sign-up sheet
  sheet: {
    label: "Save your progress",
    title: "Save your progress",
    body: "Keep your award, your streak and everything you discover.",
    apple: "Continue with Apple",
    google: "Continue with Google",
    email: "Continue with email",
    prototype: "Prototype: none of these creates an account or sends anything. Your progress is kept in this browser.",
    keptTitle: "Your discovery is kept",
    // {method} is one of the three words below
    keptBody: "In the real app, this is where your {method} sign-in would happen. This prototype doesn’t create accounts, so your award and progress are saved in this browser only.",
    methodApple: "Apple",
    methodGoogle: "Google",
    methodEmail: "email",
  },

  name: {
    ask: "By the way, what should I call you?",
    label: "Your first name",
    placeholder: "First name",
    note: "Page uses it to say hello. It stays on this device.",
  },

  reminder: {
    // {name} is the first name they typed
    askNamed: "Nice to meet you, {name}! When should I bring you each day’s discovery?",
    ask: "When should I bring you each day’s discovery?",
    groupLabel: "Daily reminder",
    // the preview notification
    appName: "Closer",
    noticeNamed: "{name}, today’s discovery is ready",
    notice: "Today’s discovery is ready",
    noticeBody: "Five minutes with Page. Your streak is waiting.",
    turnOn: "Turn on reminders",
    askOs: "Your iPhone will ask to allow notifications. In this prototype nothing is sent.",
    later: "You can change this any time in You.",
  },

  // Closer Pro trial. Prices are filled in from the plan ({price}); in the real app they come from the App Store.
  pro: {
    title: "Try Closer Pro free for 7 days",
    steps: {
      first: "Your first discovery",
      firstSaved: "It Is Written, saved to your account.",
      firstLocal: "It Is Written, kept on this device.",
      today: "Today: everything opens",
      todayBody: "Start your free week of Closer Pro.",
      day5: "Day 5: a reminder",
      day5Body: "We’ll tell you two days before the trial ends.",
      day7: "Day 7: the trial ends",
      day7Yearly: "You’re charged {price} for the year unless you cancel before.",
      day7Monthly: "You’re charged {price} a month unless you cancel before.",
    },
    planLabel: "Plan",
    yearly: "Yearly",
    yearlyPrice: "{price} a year",
    yearlyPerMonth: "{price} / month",
    yearlyBadge: "Save 37%",
    monthly: "Monthly",
    monthlyPrice: "{price} a month",
    start: "Start my free week",
    // {plan} is yearlyPrice or monthlyPrice, filled in
    terms: "7 days free, then {plan}. Cancel any time in the App Store.",
    restore: "Restore purchases",
    termsLink: "Terms",
    privacy: "Privacy",
    doneTitle: "Your free week starts today",
    doneBody: "This is a prototype, so no trial was started and nothing will be charged. In the app, this is the App Store’s purchase sheet.",
    go: "Go to Closer",
  },

  // the questionnaire onboarding (screens/Onboarding.tsx)
  onboarding: {
    back: "Back",
    helloBody: "I’ll walk with you through the Bible, a few minutes at a time.",
    getStarted: "Get started",
    tastedTitle: "You just did your first one!",
    tastedBody: "That’s how every experience works: a few minutes, and something to see for yourself.",
    intro: "Now a few quick questions, so I can pick what’s next for you. You can skip any of them.",
    letsGo: "Let’s go",
    questions: {
      reason: "What brings you to Closer?",
      level: "How well do you know the Bible?",
      likes: "What sounds good to start with? Pick as many as you like.",
      time: "How much time do you usually have?",
      reminder: "Want a gentle reminder? Only if it helps.",
    },
    // each answer: what it says, and Page's reply when picked
    reasons: {
      understand: { text: "Understand the Bible better", reply: "Love that. It’s a lot less confusing when you see how it fits together." },
      closer: { text: "Feel closer to God", reply: "That’s the heart of it. We’ll go gently." },
      hard: { text: "Get through something hard", reply: "I’m really glad you’re here. You don’t have to explain anything." },
      pray: { text: "Learn to pray", reply: "No perfect words required. Promise." },
      curious: { text: "Just curious", reply: "The best reason! There’s a lot to discover." },
    },
    levels: {
      new: { text: "I’m new to it", reply: "Perfect. I’ll explain as we go." },
      some: { text: "I know a few stories", reply: "Great start. There’s more to them than people think." },
      reads: { text: "I read it sometimes", reply: "Nice! We’ll go a little deeper." },
      well: { text: "I know it well", reply: "Ooh. Then the mysteries are calling you." },
    },
    times: {
      short: { text: "A few minutes", sub: "2–3 min", reply: "Short and sweet works." },
      five: { text: "About five minutes", sub: "Most experiences", reply: "Just right for most of them." },
      long: { text: "Ten or more", sub: "Room to linger", reply: "Then we can take our time." },
      varies: { text: "It varies", sub: "That’s fine", reply: "Same here, honestly." },
    },
    reminders: {
      morning: { text: "In the morning", reply: "A good way to start the day." },
      lunch: { text: "Around lunch", reply: "A pause in the middle of things." },
      evening: { text: "In the evening", reply: "A quiet way to end the day." },
      none: { text: "No reminders, thanks", reply: "No problem. I’ll be here whenever." },
    },
    // Page's cheer when a category is picked; they rotate
    likeCheers: ["Good pick!", "Ooh, nice.", "Yes!", "Great choice."],
    timeNote: "This just helps me suggest the right length. Any lesson keeps your streak going.",
    reminderNote: "Your answers stay on this device. You can change any of this later in You.",
    building: "Finding a good place to start…",
    ready: "Here’s where I think we should start!",
    alsoForYou: "Also for you",
    // {kind} is the lesson's category, {n} its length in minutes
    lessonMeta: "{kind} · {n} min",
    // {shelf} is the category name
    yourFirst: "Your first · {shelf}",
    minutes: "{n} min",
    start: "Start",
    ownWay: "I’ll explore on my own",
  },
};
