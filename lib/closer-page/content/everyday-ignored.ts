import type { Lesson } from "../lesson/types";

/* Everyday Faith: "The Person Everyone Ignores". Loving your neighbour.
   Variation: the choice isn't a reply to someone; it's whether to include the person on the edge. The middle
   is a knowns block on partiality (James 2:1). Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";
const invite = "Lunch? We’re going to the usual place.";

export const everydayIgnored = {
  id: "everyday-ignored",
  title: "The Person Everyone Ignores",
  subtitle: "Who counts as your neighbour?",
  kind: "Everyday faith",
  scripture: "Luke 10:27 · James 2:1 · Romans 12:16",
  minutes: 5,
  theme: "olive",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      lines: [
        { say: "There’s a new person on your team, Elena. Quiet. Eats lunch alone at her desk.", mood: "thinking" },
        { say: "Nobody’s unkind to her. Nobody really talks to her either.", mood: "tender" },
        { say: "Your usual lunch group is heading out.", mood: "curious", act: "tilt" },
      ],
      display: { text: "The Person Everyone Ignores", sub: "Everyday faith · 5 min" },
      reply: "It’s lunchtime",
    },
    {
      kind: "scenario",
      page: { at: "corner", mood: "curious" },
      person: { name: "Rob", role: "Your lunch group" },
      remember: "first",
      start: "open",
      nodes: {
        open: {
          says: invite,
          choices: [
            { text: "Yep, let’s go.", to: "a", page: { mood: "thinking" } },
            { text: "Should we ask Elena?", to: "b", page: { mood: "happy" } },
            { text: "You go ahead. I’ll stay and eat with Elena.", to: "c", page: { mood: "moved" } },
          ],
        },
        a: { says: "Great. Same table as always.", tone: "neutral" },
        b: { says: "Elena? Uh… I mean, she seems to like being on her own.", tone: "awkward", choices: [
          { text: "Maybe. Let’s ask anyway.", to: "b2", page: { mood: "happy" } },
          { text: "Yeah, probably. Let’s go.", to: "a", page: { mood: "thinking" } },
        ] },
        b2: { says: "Sure, why not. Elena, want to join us?", tone: "warm" },
        c: { says: "Oh. Okay. See you later then.", tone: "neutral" },
      },
    },
    {
      kind: "feelings",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Let’s look at what makes this hard.", mood: "curious", act: "tilt" }],
      prompt: "What gets in the way of reaching out?",
      options: [
        { text: "It’s awkward.", reply: "It is. Awkward is survivable, though." },
        { text: "I don’t know what to say.", reply: "A simple “want to join us?” is enough." },
        { text: "My friends might think it’s weird.", reply: "Honest. Fitting in pulls hard on all of us." },
        { text: "I just didn’t notice her.", reply: "Most of us don’t. Noticing is the first step." },
      ],
      many: "A few things at once. That’s why people get left on the edge.",
      after: [{ say: "Here’s the command Jesus called the greatest, along with loving God.", at: "top", mood: "thinking" }],
    },
    {
      kind: "highlight",
      page: { at: "top", mood: "thinking" },
      verse: { text: "He answered, “You shall love the Lord your God with all your heart, with all your soul, with all your strength, and with all your mind; and your neighbor as yourself.”", ref: "Luke 10:27", translation: WEB },
      target: "your neighbor as yourself",
      before: [{ say: "Find the second half.", show: "verse", mood: "curious", act: "tilt" }],
      prompt: "Mark it, or tap it",
      after: [
        { say: "Right after this, Jesus tells the story of the Good Samaritan: a neighbour is whoever you come across who needs you.", at: "top", mood: "thinking" },
        { say: "Even the quiet one at the next desk.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "knowns",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "James warns against favouritism: treating some people as more worth your time.", mood: "thinking" },
        { say: "Turn these over.", mood: "curious" },
      ],
      known: {
        label: "What love looks like here",
        items: [
          { text: "Noticing who’s left out", ref: "Luke 10:27" },
          { text: "Not playing favourites", ref: "James 2:1" },
          { text: "Spending time with the overlooked", ref: "Romans 12:16" },
        ],
      },
      unknown: {
        label: "What it doesn’t require",
        items: [{ text: "Becoming best friends overnight", ref: "Romans 12:16" }],
      },
      after: [{ say: "It starts small. One invitation. One conversation.", mood: "happy", act: "nod" }],
    },
    {
      kind: "scenario",
      page: { at: "corner", mood: "happy" },
      before: [{ say: "Lunchtime again.", at: "top", mood: "happy", act: "hop" }],
      person: { name: "Elena", role: "New on your team" },
      replay: "first",
      replayLabel: "The first time, you told Rob:",
      start: "open",
      nodes: {
        open: {
          says: "(Elena looks up as you walk over.) Oh, hi.",
          choices: [
            { text: "Hey! We’re grabbing lunch. Want to come?", to: "a", page: { mood: "happy" } },
            { text: "Mind if I eat with you today?", to: "b", page: { mood: "moved" } },
            { text: "How are you finding it here so far?", to: "c", page: { mood: "curious" } },
          ],
        },
        a: { says: "Really? I’d love that. Thank you.", tone: "warm" },
        b: { says: "Not at all! It’s been a bit lonely, honestly.", tone: "warm" },
        c: { says: "Honestly? Kind of hard. You’re the first person who’s asked.", tone: "warm" },
      },
      after: [{ say: "Thirty seconds of awkward. Maybe the best part of her week.", at: "top", mood: "moved", act: "nod" }],
    },
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "The Person Everyone Ignores",
      lines: [{ say: "Look around your week.", mood: "happy" }],
      check: {
        prompt: "Who might be on the edge near you?",
        options: [
          { text: "Someone new at work or school.", reply: "New people notice who reaches out.", mood: "happy", act: "nod" },
          { text: "Someone at church.", reply: "Sitting alone in a crowd is lonely. You could change that.", mood: "moved", act: "nod" },
          { text: "A neighbour.", reply: "That’s literally the word Jesus used.", mood: "cheeky", act: "stare" },
          { text: "Just reflect.", reply: "That’s enough for today.", mood: "tender", act: "settle" },
        ],
      },
      ask: "What’s one simple way you could include them?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "happy", act: "hop" },
      calm: true,
      title: "Love your neighbour.",
      body: "The Lord is always closer than you think.",
      summary: [
        "Nobody has to be unkind for someone to feel invisible.",
        "Jesus said to love your neighbour as yourself, and showed that means whoever is near.",
        "One small invitation can change someone’s week.",
      ],
      verse: { text: "Be of the same mind one toward another. Don’t set your mind on high things, but associate with the humble. Don’t be wise in your own conceits.", ref: "Romans 12:16", translation: WEB },
      refs: ["Luke 10:27", "James 2:1", "Romans 12:16"],
      related: [{ title: "The Woman at the Well", sub: "Jesus only · John 4", lessonId: "jesus-well" }],
      button: "Finish",
    },
  ],
} satisfies Lesson;
