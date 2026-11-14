import type { Lesson } from "../lesson/types";

/* Ruth and Naomi, Ruth 1. Scripture is the World English Bible, word for word. */

const WEB = "World English Bible";

export const ruth = {
  id: "ruth",
  title: "Ruth and Naomi",
  subtitle: "The daughter-in-law who wouldn’t leave",
  kind: "Character study",
  scripture: "Ruth 1",
  minutes: 4,
  theme: "burgundy",
  blocks: [
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "excited" },
      lines: [{ say: "Hey! Want to meet one of the most loyal people in the whole Bible?", mood: "curious", act: "tilt" }],
      reply: "Who is it?",
    },
    {
      kind: "character",
      page: { at: "left", mood: "neutral", act: "hop" },
      name: "Naomi",
      place: "of Bethlehem",
      figure: "woman2",
      companions: [{ name: "Ruth", figure: "woman" }, { name: "Orpah", figure: "woman" }],
      note: { text: "Mahlon and Chilion both died, and the woman was bereaved of her two children and of her husband.", ref: "Ruth 1:5", translation: WEB },
      lines: [
        { say: "First, meet Naomi. She moved far from home, to a land called Moab." },
        { say: "Then she lost her husband, and both her sons.", show: "note", mood: "tender" },
        { say: "Her two daughters-in-law were all she had left.", show: "companions", mood: "tender" },
      ],
    },
    {
      kind: "story",
      page: { at: "top", mood: "tender" },
      beats: [
        {
          say: "Naomi decided to go home to Bethlehem. And she told them not to come.",
          mood: "tender",
          card: { text: "“Go, return each of you to her mother’s house.", ref: "Ruth 1:8", translation: WEB },
        },
        {
          say: "Orpah cried, kissed her goodbye, and went home.",
          mood: "tender",
          card: { text: "They lifted up their voices, and wept again; then Orpah kissed her mother-in-law, but Ruth joined with her.", ref: "Ruth 1:14", translation: WEB },
        },
        { say: "But Ruth didn’t budge.", mood: "curious", act: "lean" },
      ],
    },
    {
      kind: "highlight",
      theme: "forest",
      page: { at: "top", mood: "thinking" },
      verse: { text: "“where you go, I will go”", ref: "Ruth 1:16", translation: WEB },
      context: { text: "Your people will be my people, and your God my God.", ref: "Ruth 1:16", translation: WEB },
      before: [
        { say: "Naomi tried one more time to send her home.", mood: "tender" },
        { say: "Ruth answered with this.", show: "verse", open: true, mood: "moved" },
        { say: "Six words. A whole life in them.", mood: "thinking", open: false },
      ],
      prompt: "Swipe across the words to highlight them",
      after: [
        { say: "She wasn’t leaving Naomi alone on that road. Not for anything.", mood: "moved" },
        { say: "And she kept going.", show: "context", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "story",
      page: { at: "top", mood: "happy" },
      beats: [
        {
          say: "So they walked home together.",
          mood: "happy",
          card: { text: "So Naomi returned, and Ruth the Moabitess, her daughter-in-law, with her, who returned out of the country of Moab. They came to Bethlehem in the beginning of barley harvest.", ref: "Ruth 1:22", translation: WEB },
        },
        { say: "That harvest is where Ruth’s story really takes off. But that’s for another day.", mood: "cheeky", act: "hop" },
      ],
    },
    {
      kind: "question",
      page: { at: "left", mood: "curious", act: "tilt" },
      prompt: "Who stayed with Naomi?",
      options: [
        { text: "Ruth", correct: true, reply: "Yes. Ruth, all the way to Bethlehem." },
        { text: "Orpah", reply: "Orpah went home. It was Ruth who stayed." },
        { text: "Nobody", reply: "Someone did. Ruth stayed, all the way to Bethlehem." },
      ],
    },
    {
      kind: "reflection",
      page: { at: "center", mood: "curious", act: "tilt" },
      prompt: "Who has stayed with you when leaving would’ve been easier?",
      options: [
        { text: "Someone in my family", reply: "That’s a Ruth. Maybe tell them today." },
        { text: "A friend", reply: "A friend like that is a gift from God. Don’t lose their number." },
        { text: "God, more than anyone", reply: "Every time. He’s the one who never turns back." },
        { text: "I’m still waiting for that", reply: "I’m sorry. That’s hard. You’re not walking alone, even when it feels that way." },
      ],
    },
    {
      kind: "verse",
      page: { at: "top", mood: "thinking" },
      before: [{ say: "Here’s the whole thing Ruth said.", mood: "thinking", open: true }],
      verse: { text: "“Don’t urge me to leave you, and to return from following you, for where you go, I will go; and where you stay, I will stay. Your people will be my people, and your God my God.", ref: "Ruth 1:16", translation: WEB },
      after: [{ say: "Who could you stay with like that this week?", mood: "celebrating", act: "celebrate", open: false }],
      reply: "Finish",
    },
    {
      kind: "complete",
      page: { at: "center", mood: "celebrating", act: "celebrate" },
      title: "That’s the story.",
      body: "The Lord is always closer than you think.",
      keep: { text: "“Don’t urge me to leave you, and to return from following you, for where you go, I will go; and where you stay, I will stay. Your people will be my people, and your God my God.", ref: "Ruth 1:16", translation: WEB },
    },
  ],
} satisfies Lesson;
