import type { Lesson } from "../lesson/types";

/* Everyday Faith: "Nobody Noticed". Serving without recognition.
   Variation: no replay. After the scenario, the middle uses both-feelings and Colossians 3:23–24 ("as for the
   Lord"). Wanting thanks isn't wrong; the point is who you're ultimately working for.
   Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";

export const everydayNoticed = {
  id: "everyday-noticed",
  title: "Nobody Noticed",
  subtitle: "Serving when no one says thanks",
  kind: "Everyday faith",
  scripture: "Matthew 6:3–4 · Colossians 3:23–24",
  minutes: 5,
  theme: "olive",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "happy" },
      lines: [
        { say: "Last night you stayed two hours after the event, stacking chairs and cleaning up.", mood: "happy" },
        { say: "This morning, the organiser posts a thank-you in the team chat.", mood: "curious", act: "tilt" },
        { say: "Your name isn’t in it.", mood: "surprised", act: "shake" },
      ],
      display: { text: "Nobody Noticed", sub: "Everyday faith · 5 min" },
      reply: "Read the post",
    },
    {
      kind: "scenario",
      page: { at: "corner", mood: "curious" },
      person: { name: "Priya", role: "Event organiser" },
      start: "open",
      nodes: {
        open: {
          says: "Huge thanks to Ben and Lisa for making last night happen! Couldn’t have done it without you!",
          choices: [
            { text: "(Reply) Glad it went well! Some of us were there till midnight, lol.", to: "a", page: { mood: "cheeky" } },
            { text: "(Say nothing. Feel invisible.)", to: "b", page: { mood: "tender" } },
            { text: "(Message Priya privately) Hey, just so you know, I stayed late to clean up.", to: "c", page: { mood: "thinking" } },
          ],
        },
        a: { says: "Oh no! Were you? I had no idea. Thank you so much!", tone: "awkward" },
        b: { says: "(The chat moves on to next month’s plans.)", tone: "neutral" },
        c: { says: "Oh, I’m so sorry, I didn’t know! Thank you, really.", tone: "warm" },
      },
    },
    {
      kind: "feelings",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Let’s be honest about this one.", mood: "curious", act: "tilt" }],
      prompt: "How does being overlooked feel?",
      options: [
        { text: "Invisible.", reply: "Like your effort didn’t count. That hurts." },
        { text: "Annoyed.", reply: "Fair. It was a lot of work." },
        { text: "A bit petty for minding.", reply: "Wanting thanks isn’t petty. It’s human." },
        { text: "Mostly fine, honestly.", reply: "Good. Let’s still look at what’s underneath." },
      ],
      many: "A mix. Totally normal.",
      after: [{ say: "Jesus actually talked about this.", at: "top", mood: "thinking" }],
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "thinking" },
      verse: { text: "so that your merciful deeds may be in secret, then your Father who sees in secret will reward you openly.", ref: "Matthew 6:4", translation: WEB },
      target: "your Father who sees in secret",
      before: [{ say: "Look who notices the things nobody else does.", show: "verse", mood: "curious", act: "tilt" }],
      prompt: "Mark who sees, or tap it",
      after: [
        { say: "Nobody noticed. Except the one who always does.", at: "top", mood: "moved", act: "nod" },
        { say: "Paul says the same: work heartily, as for the Lord, and not for men.", show: "context", mood: "thinking" },
      ],
      context: { text: "And whatever you do, work heartily, as for the Lord, and not for men,", ref: "Colossians 3:23", translation: WEB },
    },
    {
      kind: "both",
      page: { at: "top", mood: "curious" },
      before: [{ say: "Do you have to stop wanting to be thanked?", mood: "curious", act: "tilt" }],
      a: "I’d like to be thanked.",
      b: "I did it for God.",
      joined: "I’d like to be thanked, *and* I did it for God.",
      prompt: "Drag one onto the other, or press the button",
      after: [
        { say: "Both can be true.", mood: "happy", act: "hop" },
        { say: "The thanks would be nice. It’s just not why you did it.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "Nobody Noticed",
      lines: [{ say: "Here’s a quiet idea.", mood: "happy" }],
      check: {
        prompt: "What could you do this week, just for God?",
        options: [
          { text: "Something kind nobody will know about.", reply: "Your Father who sees in secret will see.", mood: "moved", act: "nod" },
          { text: "Thank someone who usually gets overlooked.", reply: "You know how it feels. That makes it count more.", mood: "happy", act: "hop" },
          { text: "Keep serving, without keeping score.", reply: "That’s freedom, honestly.", mood: "happy", act: "nod" },
          { text: "Just reflect.", reply: "That’s enough for today.", mood: "tender", act: "settle" },
        ],
      },
      ask: "Who serves quietly around you, without thanks?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "happy", act: "hop" },
      calm: true,
      title: "Seen in secret.",
      body: "The Lord is always closer than you think.",
      summary: [
        "Wanting to be thanked is human, not shameful.",
        "Jesus says your Father sees what’s done in secret.",
        "You can serve as for the Lord, and let that be enough.",
      ],
      verse: { text: "And whatever you do, work heartily, as for the Lord, and not for men,", ref: "Colossians 3:23", translation: WEB },
      refs: ["Matthew 6:3–4", "Colossians 3:23–24"],
      related: [{ title: "The man who found God while washing dishes", sub: "Testimony · Brother Lawrence", lessonId: "brother-lawrence" }],
      button: "Finish",
    },
  ],
} satisfies Lesson;
