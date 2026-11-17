import type { Lesson } from "../lesson/types";

/* Closer Poetry: You Are Still Loved
   The quiet one. A short original poem for someone who feels they've let God down: the prayer they skipped, the
   thing they said, the counting that follows. It turns on the father in Luke 15 who runs while the son is still far
   off, and ends where Scripture ends: still loved.

   Kept honest, line by line:
   - The poem is original and labelled as a poem; Scripture is shown separately, labelled, World English Bible word
     for word (poetic line breaks joined with spaces).
   - Two lines echo Psalm 103:14 closely; the echoes block shows exactly where.
   - Page is a guide who goes quiet for the poem; he doesn't speak for God.
   - Nothing is asked, scored or saved. The prayer is optional. */

const WEB = "World English Bible";

export const poemLoved = {
  id: "poem-loved",
  title: "You Are Still Loved",
  subtitle: "A quiet poem for a hard day",
  kind: "Closer Poetry",
  scripture: "Luke 15 · Psalm 103 · Lamentations 3 · Romans 8",
  minutes: 3,
  theme: "dusk",
  quiet: true,
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "tender" },
      display: { text: "You Are Still Loved", sub: "Closer Poetry · 3 min" },
      lines: [
        { say: "Today I have a poem for you.", mood: "tender", act: "settle" },
        { say: "Read it slowly. There’s nothing to get right.", mood: "happy", act: "nod" },
      ],
      reply: "Begin",
    },
    {
      kind: "plovedPoem",
      before: [{ say: "I’ll be quiet now.", at: "top", mood: "tender", act: "settle" }],
      title: "You Are Still Loved",
      stanzas: [
        [
          "You said you would pray this morning.",
          "The alarm went off. You didn’t.",
          "The Bible stayed shut on the chair,",
          "under yesterday’s hoodie.",
        ],
        [
          "You said the thing you swore you’d stop saying.",
          "You saw the look on their face.",
          "You lay awake replaying it,",
          "and counted every time before.",
        ],
        [
          "And somewhere in the counting",
          "you decided God was counting too,",
          "standing at the door, arms folded,",
          "waiting for you to do better.",
        ],
        [
          "But that is not the door in the story.",
          "In the story, the son is still far off,",
          "still practising his speech,",
          "when the father sees him, and runs.",
        ],
        [
          "He knows how you are made.",
          "He remembers you are dust.",
          "His mercy did not run out last night.",
          "It was new again this morning.",
        ],
        [
          "So come as you are,",
          "with the shut Bible and the thing you said.",
          "You are not too late.",
          "You are still loved.",
        ],
      ],
      breathe: { at: 4, hint: "Hold the light, and take one slow breath", holding: "Breathe in… and out", skip: "Keep reading" },
      after: { say: "Take as long as you like with it.", at: "top", mood: "tender", act: "nod" },
      again: "Read it again",
    },
    {
      kind: "plovedEchoes",
      before: [
        { say: "The poem is mine. What it leans on isn’t.", at: "top", mood: "curious", act: "tilt" },
      ],
      hint: "Tap a line to see the Scripture under it",
      echoes: [
        {
          line: "when the father sees him, and runs.",
          verse: { text: "“He arose, and came to his father. But while he was still far off, his father saw him, and was moved with compassion, and ran, and fell on his neck, and kissed him.", ref: "Luke 15:20", translation: WEB },
          say: "Jesus told this story. The father runs first.",
        },
        {
          line: "He remembers you are dust.",
          verse: { text: "Like a father has compassion on his children, so Yahweh has compassion on those who fear him. For he knows how we are made. He remembers that we are dust.", ref: "Psalm 103:13–14", translation: WEB },
          say: "He isn’t surprised by how weak we are.",
        },
        {
          line: "It was new again this morning.",
          verse: { text: "It is because of Yahweh’s loving kindnesses that we are not consumed, because his compassion doesn’t fail. They are new every morning. Great is your faithfulness.", ref: "Lamentations 3:22–23", translation: WEB },
          say: "Written in the ruins of Jerusalem, of all places.",
        },
        {
          line: "You are still loved.",
          verse: { text: "For I am persuaded that neither death, nor life, nor angels, nor principalities, nor things present, nor things to come, nor powers, nor height, nor depth, nor any other created thing, will be able to separate us from God’s love, which is in Christ Jesus our Lord.", ref: "Romans 8:38–39", translation: WEB },
          say: "Nothing on Paul’s list can separate you from it.",
        },
      ],
      after: { say: "That’s what the poem stands on.", at: "top", mood: "happy", act: "nod" },
    },
    {
      kind: "plovedPrayer",
      ask: { say: "Would you like to pray before you go?", at: "top", mood: "tender", act: "settle" },
      pray: "Pray with me",
      skip: "Not today",
      lines: [
        "Father, I come back as I am.",
        "You know what I did, and what I didn’t do.",
        "Thank you that your love doesn’t wait for me to be better.",
        "Stay close to me today.",
        "In Jesus’ name, amen.",
      ],
      amen: "Amen",
      left: "That’s fine. The poem will still be here.",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "tender", act: "settle" },
      calm: true,
      title: "You are still loved",
      body: "",
      summary: [
        "God isn’t standing at the door with his arms folded.",
        "In Jesus’ story, the father runs while the son is still far off.",
        "His mercy is new every morning, including this one.",
      ],
      refs: ["Luke 15:11–24", "Psalm 103:8–14", "Lamentations 3:22–23", "Romans 8:38–39"],
      related: [
        { title: "A Little Reminder", sub: "Heart to Heart · 3 min", lessonId: "heart-reminder" },
        { title: "When I Feel Far Away", sub: "Closer Poetry · 5 min", lessonId: "poem-far" },
        { title: "Can God forgive anyone?", sub: "Big question · 6 min", lessonId: "forgive-anyone" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
