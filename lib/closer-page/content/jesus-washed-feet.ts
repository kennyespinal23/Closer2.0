import type { Lesson } from "../lesson/types";

/* Jesus Only: "The King Who Washed Feet", John 13:1–17.
   Central question: what kind of king kneels down?
   - Every spoken line is Scripture (World English Bible, word for word). Page comments on it but never
     speaks for Jesus or for anyone in the story.
   - The text, its historical background, and readings of it are tagged separately on screen. */

const WEB = "World English Bible";

export const jesusWashedFeet = {
  id: "jesus-washed-feet",
  title: "The King Who Washed Feet",
  subtitle: "What kind of king kneels down?",
  kind: "Jesus only",
  scripture: "John 13:1–17",
  minutes: 5,
  theme: "wine",
  blocks: [
    // 1. The hook
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      lines: [
        { say: "Imagine being the most important person in the room.", mood: "curious", act: "tilt" },
        { say: "Now imagine getting down to wash everyone else’s feet.", mood: "surprised" },
        { say: "That’s exactly what Jesus did.", mood: "moved", act: "nod" },
      ],
      display: { text: "The King Who Washed Feet", sub: "John 13:1–17 · World English Bible" },
      reply: "Discover why",
    },
    // 2. The setting
    {
      kind: "turning",
      scene: "still",
      page: { at: "top", mood: "thinking" },
      beats: [
        {
          when: "The night before he died", tag: "text", intensity: 0,
          text: "Jesus was at supper with his disciples, just before the Passover feast. It was their last meal together before his arrest.",
          verse: { text: "Now before the feast of the Passover, Jesus, knowing that his time had come that he would depart from this world to the Father, having loved his own who were in the world, he loved them to the end.", ref: "John 13:1", translation: WEB },
          say: "He knew what was coming.", mood: "tender",
        },
        {
          tag: "text", intensity: 0,
          text: "John tells us Jesus knew exactly who he was.",
          verse: { text: "Jesus, knowing that the Father had given all things into his hands, and that he came from God, and was going to God,", ref: "John 13:3", translation: WEB },
          say: "Remember that. It matters in a minute.", mood: "thinking", act: "tilt",
        },
        {
          tag: "context", intensity: 0,
          text: "People walked dusty roads in sandals. Washing feet was a lowly job, usually left to a servant, or done by guests for themselves. A teacher washing his followers’ feet would have been shocking.",
          say: "Feet were dirty. Really dirty.", mood: "cheeky", act: "stare",
        },
      ],
      after: [],
    },
    // 3. The unexpected action
    {
      kind: "context",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Then, in the middle of supper, Jesus does something nobody expected.", mood: "surprised", act: "hop" },
        { say: "Tap through what he does, in order.", show: "verse", mood: "curious" },
      ],
      verse: {
        text: "…arose from supper, and laid aside his outer garments. He took a towel, and wrapped a towel around his waist. Then he poured water into the basin, and began to wash the disciples’ feet, and to wipe them with the towel that was wrapped around him.",
        ref: "John 13:4–5",
        translation: WEB,
      },
      hint: "Tap each step in the verse",
      visual: "steps",
      links: [
        { phrase: "arose from supper", label: "He gets up from the meal", note: "He gets up." },
        { phrase: "He took a towel", label: "He takes a towel", note: "He takes a towel, like a servant would." },
        { phrase: "began to wash the disciples’ feet", label: "He washes their feet", note: "And he starts washing their feet. One by one." },
      ],
      after: [
        { say: "The one with all things in his hands picks up a towel.", at: "top", mood: "moved", act: "nod" },
        { say: "He doesn’t explain first. He just does it.", mood: "thinking" },
      ],
    },
    // 4. Peter's reaction
    {
      kind: "exchange",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "Then he reaches Peter.", mood: "curious", act: "tilt" },
        { say: "Peter is not okay with this.", mood: "cheeky", act: "stare" },
      ],
      lines: [
        { who: "Peter", text: "“Lord, do you wash my feet?”", ref: "John 13:6", translation: WEB, say: "He can’t believe it.", mood: "surprised" },
        { who: "Jesus", side: "right", text: "“You don’t know what I am doing now, but you will understand later.”", ref: "John 13:7", translation: WEB, say: "Not now. Later.", mood: "thinking" },
        { who: "Peter", text: "“You will never wash my feet!”", ref: "John 13:8", translation: WEB, say: "Never!", mood: "surprised", act: "shake" },
        { who: "Jesus", side: "right", text: "“If I don’t wash you, you have no part with me.”", ref: "John 13:8", translation: WEB, say: "That stops Peter in his tracks.", mood: "thinking" },
        { who: "Peter", text: "“Lord, not my feet only, but also my hands and my head!”", ref: "John 13:9", translation: WEB, say: "And he swings all the way the other way.", mood: "cheeky", act: "hop" },
      ],
      after: [{ say: "So why was Peter so uncomfortable?", at: "top", mood: "curious", act: "tilt" }],
    },
    {
      kind: "perspectives",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "John doesn’t spell it out. Here are ways readers have understood it. Open each one.", mood: "thinking" }],
      cards: [
        {
          title: "It was a servant’s job",
          say: "His Lord, doing the lowest job in the house.",
          body: "Peter called Jesus Lord. Watching him do the job of a servant felt upside down. Jesus agreed with the title, and served anyway.",
          verse: { text: "You call me, ‘Teacher’ and ‘Lord.’ You say so correctly, for so I am.", ref: "John 13:13", translation: WEB },
        },
        {
          title: "Being served is humbling",
          say: "Letting someone serve you can be harder than serving.",
          body: "Peter would rather do things for Jesus than let Jesus do things for him. Many Christians read Jesus’ reply as pointing beyond feet: Peter needed what only Jesus could give him.",
          verse: { text: "“If I don’t wash you, you have no part with me.”", ref: "John 13:8", translation: WEB },
        },
        {
          title: "He didn’t understand yet",
          say: "Jesus said understanding would come later.",
          body: "John wrote this looking back, after the cross and the resurrection, when the disciples understood far more.",
          verse: { text: "“You don’t know what I am doing now, but you will understand later.”", ref: "John 13:7", translation: WEB },
        },
      ],
      caveat: "The text tells us what Peter said, not everything he felt. These are readings, not extra Scripture.",
      after: [{ say: "Now, what Jesus said when he’d finished.", at: "top", mood: "curious" }],
    },
    // 5. What Jesus meant
    {
      kind: "highlight",
      page: { at: "top", mood: "thinking" },
      verse: { text: "For I have given you an example, that you also should do as I have done to you.", ref: "John 13:15", translation: WEB },
      target: "do as I have done to you",
      before: [{ say: "He sat back down and told them why. Look at what he asks them to do.", show: "verse", mood: "thinking", act: "tilt" }],
      prompt: "Mark what Jesus asks of them, or tap it",
      after: [
        { say: "He didn’t just give them a rule.", at: "top", mood: "moved" },
        { say: "He showed them first. Then he said: now you.", show: "context", mood: "moved", act: "nod" },
      ],
      context: { text: "If I then, the Lord and the Teacher, have washed your feet, you also ought to wash one another’s feet.", ref: "John 13:14", translation: WEB },
    },
    // 6. The meaning
    {
      kind: "assemble",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "So what does this moment show us about Jesus?", show: "not", mood: "thinking" }],
      not: "Greatness means being served.",
      but: "Jesus showed greatness by serving.",
      prompt: "Drag the true one into place, or tap it",
      after: [
        { say: "He knew all things were in his hands. And he used them to wash feet.", mood: "moved", act: "nod" },
        { say: "Here’s the heart of it.", show: "takeaway", mood: "moved" },
      ],
      takeaway: "Jesus showed that true greatness is expressed through humble love and service.",
    },
    // 7. Reflection
    {
      kind: "journal",
      page: { at: "center", mood: "tender", act: "settle" },
      ref: "The King Who Washed Feet",
      lines: [{ say: "Can I ask you something?", mood: "tender" }],
      check: {
        prompt: "What’s one small way you could serve someone today?",
        options: [
          { text: "Help with something nobody wants to do.", reply: "That’s about as close to a towel and a basin as it gets.", mood: "happy", act: "nod" },
          { text: "Really listen to someone.", reply: "Unhurried attention is a kind of service.", mood: "moved", act: "nod" },
          { text: "Do something kind no one will notice.", reply: "Quiet service. Jesus didn’t make a show of it either.", mood: "moved", act: "nod" },
          { text: "I’ll think about it.", reply: "No pressure. Just notice the chances today.", mood: "tender", act: "settle" },
        ],
      },
      ask: "Who comes to mind?",
      write: "Write a thought",
      skip: "Just continue",
      placeholder: "Only you will see this.",
      quiet: "",
    },
    // 8. Completion
    {
      kind: "complete",
      page: { at: "top", mood: "moved", act: "nod" },
      calm: true,
      title: "What we discovered about Jesus",
      body: "The Lord is always closer than you think.",
      summary: [
        "He knew all things were in his hands, and he knelt to wash his friends’ feet.",
        "He let Peter object, and told him he would understand later.",
        "He showed his followers how to love one another: by serving.",
      ],
      verse: { text: "For I have given you an example, that you also should do as I have done to you.", ref: "John 13:15", translation: WEB },
      refs: ["John 13:1–17"],
      related: [
        { title: "The Man in the Tree", sub: "Jesus only · Luke 19", lessonId: "jesus-zacchaeus" },
        { title: "The Moment Peter Sank", sub: "Jesus only · Matthew 14", lessonId: "jesus-peter-sank" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
