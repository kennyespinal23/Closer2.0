import type { Lesson } from "../lesson/types";

/* Heart to Heart: A Little Reminder
   Not a lesson. Page sets the learning aside for one day and points to four things Scripture says, one at a time,
   while the morning comes up behind the hills. Then all four together to read again, as slowly as you like, and a
   short prayer.

   Kept honest, line by line:
   - Page never speaks for God. He hands over to Scripture ("Here’s what Scripture says"), and each truth sits on
     its passage, quoted from the World English Bible word for word.
   - The four truths are the user's own wording; each passage was picked because it says that thing plainly:
     Jesus' love (John 15:9, his own words), love that came while we were still sinners (Romans 5:8), his
     invitation to the weary (Matthew 11:28), and his promise to be with his people always (Matthew 28:20).
   - The prayer is exactly as written in the brief.
   - No score, quiz, points or celebration. Nothing is saved. Nothing of Jesus himself is drawn. */

const WEB = "World English Bible";

export const heartReminder = {
  id: "heart-reminder",
  title: "A Little Reminder",
  subtitle: "A pause in your day",
  kind: "Heart to Heart",
  scripture: "John 15:9 · Romans 5:8 · Matthew 11:28 · Matthew 28:20",
  minutes: 3,
  theme: "ember",
  quiet: true,
  blocks: [
    {
      kind: "remindPause",
      hello: { named: "Hi, {name}.", plain: "Hi." },
      lines: [
        "Let’s take a little break from learning today.",
        "There’s something I want you to remember.",
      ],
      pointTo: "Here’s what Scripture says.",
      truths: [
        { line: "Jesus loves you.", verse: { text: "Even as the Father has loved me, I also have loved you. Remain in my love.", ref: "John 15:9", translation: WEB } },
        { line: "He knows your imperfections, and He still loves you.", verse: { text: "But God commends his own love toward us, in that while we were yet sinners, Christ died for us.", ref: "Romans 5:8", translation: WEB } },
        { line: "You can come to Him just as you are.", verse: { text: "Come to me, all you who labor and are heavily burdened, and I will give you rest.", ref: "Matthew 11:28", translation: WEB } },
        { line: "You are not alone. He is with you.", verse: { text: "Behold, I am with you always, even to the end of the age.", ref: "Matthew 28:20", translation: WEB } },
      ],
      again: { say: "Take a moment. Read them again, as slowly as you like.", reread: "Read them again", go: "Continue" },
      prayer: {
        invite: "Will you pray with me?",
        label: "Pray it, out loud or quietly",
        sentences: [
          "Lord, we put our hope in You.",
          "Help us remember Your love and trust that You are near.",
          "In Jesus’ name we pray. Amen.",
        ],
        amen: "Amen",
      },
      tapHint: "Tap anywhere to continue",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "tender", act: "settle" },
      calm: true,
      title: "Jesus loves you. You are not alone.",
      body: "",
      refs: ["John 15:9", "Romans 5:8", "Matthew 11:28", "Matthew 28:20"],
      related: [
        { title: "You Are Still Loved", sub: "Closer Poetry · 3 min", lessonId: "poem-loved" },
        { title: "How Close Do You Feel to God?", sub: "Heart to Heart · 5 min", lessonId: "heart-close" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
