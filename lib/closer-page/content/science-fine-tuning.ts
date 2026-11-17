import type { Lesson } from "../lesson/types";

/* Faith & Science: Is the Universe Fine-Tuned for Life?
   You play with the laws of nature on a mixing desk, scan for carbon's famous energy level, feel the size of the
   cosmological-constant problem, and look at the puzzle through four lenses.

   Kept honest, line by line:
   - The desk is illustrative and qualitative. Physicists vary constants one at a time with big simplifications; some
     results (strong force and hydrogen) are debated, and changing several constants together can open other options.
   - Carbon's level (about 7.65 MeV) is measured; how sensitive it is to the underlying forces is debated, and said so.
   - 10^120 is the most-quoted size of the vacuum-energy mismatch; estimates vary with the assumptions.
   - Design, selection effects, multiverse ideas and deeper physics are each given their support and main objection.
     Fine-tuning is never presented as proof of God, or as disproof.
   - Scripture is the World English Bible, word for word. The reflection is optional and nothing is saved. */

const WEB = "World English Bible";

export const scienceFineTuning = {
  id: "science-fine-tuning",
  title: "Is the Universe Fine-Tuned for Life?",
  subtitle: "A Universe Simulator, four dials and a big question",
  kind: "Faith and science",
  scripture: "Psalm 8:3–4",
  minutes: 5,
  theme: "cosmos",
  blocks: [
    // the question
    {
      kind: "dialogue",
      page: { at: "hero", act: "enter", mood: "curious" },
      display: { text: "Is the Universe Fine-Tuned for Life?", sub: "Faith & Science · Universe Simulator" },
      lines: [
        { say: "What if the laws of nature had come out a little different?", mood: "curious", act: "tilt" },
        { say: "Would anyone be here to notice?", mood: "cheeky", act: "stare" },
      ],
      reply: "Let’s build a universe",
    },
    {
      kind: "ask",
      page: { at: "top", mood: "curious" },
      prompt: "Make a guess first. If gravity were a bit stronger…",
      options: [
        { text: "Not much would change", reply: "Let’s see if you’re right.", mood: "curious", act: "tilt" },
        { text: "Something dramatic", reply: "Hold that thought.", mood: "excited", act: "hop" },
        { text: "No idea", reply: "Perfect. Let’s find out.", mood: "happy", act: "nod" },
      ],
      after: [
        { say: "Here’s your desk. Four of nature’s settings.", mood: "excited", act: "hop" },
      ],
    },

    // the Universe Simulator
    {
      kind: "tuneDesk",
      page: { at: "top", mood: "excited" },
      before: [
        { say: "The middle notch on each dial is our universe.", mood: "happy" },
      ],
      hint: "Slide each dial up or down. Watch what happens.",
      reset: "Now set every dial back to ours.",
      note: "Illustrative only, one dial at a time. Some results are debated.",
      after: [
        { say: "Back home. Stars, carbon, galaxies.", mood: "moved", act: "nod" },
        { say: "Nudge one setting and something we need tends to go.", mood: "thinking" },
        { say: "That’s the fine-tuning question.", mood: "curious", act: "tilt" },
      ],
    },

    // a measured example: carbon
    {
      kind: "tuneCarbon",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "You’re made of carbon. So how do stars make it?", mood: "curious", act: "tilt" },
        { say: "Two helium nuclei briefly join. A third has to stick.", mood: "thinking" },
      ],
      hint: "Slide through the energies. Find where carbon forms.",
      findings: [
        { tag: "observation", text: "Carbon-12 has an energy level at about 7.65 MeV, just above what beryllium-8 and helium-4 bring together. That lets stars make carbon efficiently." },
        { tag: "observation", text: "Fred Hoyle predicted this level in 1953, reasoning from how much carbon exists. A team at Caltech soon found it." },
        { tag: "open", text: "How sensitive it is to the underlying forces is debated. Estimates run from under a percent to a few percent." },
      ],
      after: [
        { say: "A level in just the right place. Measured, not guessed.", mood: "moved", act: "nod" },
      ],
    },

    // the biggest mismatch
    {
      kind: "tuneZeros",
      page: { at: "top", mood: "curious" },
      before: [
        { say: "One dial is stranger than the rest: the cosmic push.", mood: "curious" },
        { say: "Simple theories predict it should be enormous. It isn’t.", mood: "surprised", act: "react" },
        { say: "How far off? Hold the button.", mood: "cheeky", act: "stare" },
      ],
      hold: "Hold to add zeros",
      to: 120,
      marks: [
        { power: 9, label: "A billion." },
        { power: 18, label: "Roughly the grains of sand on Earth." },
        { power: 80, label: "About the atoms in the observable universe." },
        { power: 120, label: "The gap between a simple estimate and what we observe." },
      ],
      finding: { tag: "open", text: "Why the cosmological constant is so small is one of physics’ biggest unsolved problems. The size of the gap depends on assumptions; 10¹²⁰ is the figure most often quoted." },
      after: [
        { say: "Nobody knows why. Physicists still argue about it.", mood: "thinking", act: "nod" },
      ],
    },

    // four ways to read it
    {
      kind: "tuneLenses",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "So what explains the tuning?", mood: "thinking", act: "tilt" },
        { say: "People look at it through different lenses.", mood: "curious" },
      ],
      hint: "Look through each lens.",
      lenses: [
        {
          id: "design", name: "Design", tag: "interpretation",
          claim: "The settings are as they are on purpose, by a Creator.",
          support: "A universe that seems set up for life suggests, to many, someone who set it up. Many Christians read it alongside Psalm 19.",
          objection: "Critics call it reasoning from gaps in what we know. Some Christians also prefer not to rest faith on it.",
          say: "One reading: it was meant.",
        },
        {
          id: "selection", name: "Selection", tag: "interpretation",
          claim: "We could only ever find ourselves in a universe that allows observers.",
          support: "That’s true, and widely accepted. It explains why we see life-friendly values.",
          objection: "On its own, it doesn’t explain why a universe like this exists at all.",
          say: "Of course we see a livable universe. We’re in it.",
        },
        {
          id: "multiverse", name: "Multiverse", tag: "open",
          claim: "There may be many universes, each with different settings. We’re in one that works.",
          support: "Some theories, like eternal inflation and the string landscape, may imply many universes.",
          objection: "No other universe has been observed, and it may never be testable. It also doesn’t rule out design.",
          say: "Speculative, and hotly debated.",
        },
        {
          id: "physics", name: "Deeper physics", tag: "open",
          claim: "A future theory might show the settings couldn’t have been otherwise.",
          support: "Physics has explained apparent coincidences before.",
          objection: "No such theory exists yet. And it may only move the question: why that theory?",
          say: "Maybe the dials aren’t free at all.",
        },
      ],
      shared: {
        title: "How likely were other values?",
        text: "Nobody knows what range the constants could have taken, or how likely each value was. So “how improbable” is hard to pin down, for every view.",
        say: "Here’s the catch none of them escapes.",
      },
      after: [
        { say: "Fine-tuning doesn’t prove God. Or disprove him.", mood: "thinking", act: "nod" },
        { say: "A real puzzle, read differently.", mood: "happy" },
      ],
    },
    {
      kind: "verse",
      page: { at: "top", mood: "tender" },
      before: [
        { say: "Long before physics, a psalmist looked up and asked this.", mood: "tender" },
      ],
      verse: { text: "When I consider your heavens, the work of your fingers, the moon and the stars, which you have ordained; what is man, that you think of him? What is the son of man, that you care for him?", ref: "Psalm 8:3–4", translation: WEB },
      after: [
        { say: "Not a calculation. A question asked in wonder.", mood: "moved", act: "nod" },
      ],
    },
    {
      kind: "knowns",
      page: { at: "top", mood: "thinking" },
      before: [
        { say: "Here’s what’s known, and what’s still argued over.", mood: "thinking" },
      ],
      known: {
        label: "Well established",
        items: [
          { text: "In models, small changes to some constants change stars and chemistry a lot.", ref: "Physics" },
          { text: "Carbon forms through a well-placed energy level.", ref: "Measured, 1950s" },
          { text: "The cosmological constant is tiny but not zero.", ref: "Observed, 1998" },
        ],
      },
      unknown: {
        label: "Still debated",
        items: [
          { text: "How finely tuned each constant really is.", ref: "Open" },
          { text: "Whether other universes exist.", ref: "Open" },
          { text: "Why the constants have these values at all.", ref: "Open" },
        ],
      },
      after: [
        { say: "Known, debated, and wondered at. All three at once.", mood: "happy", act: "nod" },
      ],
    },

    // a gentle, optional reflection: nothing is saved or scored
    {
      kind: "reflection",
      page: { at: "top", mood: "tender" },
      prompt: "When you look up at the night sky, what do you feel?",
      options: [
        { text: "Wonder", reply: "Hold on to that. It’s where this whole question starts." },
        { text: "Very small", reply: "The psalmist felt that too. And then: “you care for him.”" },
        { text: "Curious", reply: "Good. There’s more to discover." },
      ],
      skip: "Skip for now",
      note: "Just for you. Nothing is saved.",
    },
    {
      kind: "complete",
      page: { at: "top", mood: "celebrating", act: "celebrate" },
      calm: true,
      title: "A finely tuned question",
      body: "",
      summary: [
        "Nudge some of nature’s settings and stars, carbon or galaxies tend to go.",
        "Carbon’s energy level is measured; how fine the tuning is, is debated.",
        "Design, selection, multiverse and deeper physics read it differently. None settles it.",
      ],
      refs: ["Psalm 8:3–4"],
      sources: [
        { title: "Just Six Numbers (1999)", publisher: "Martin Rees, Basic Books" },
        { title: "The Fine-Tuning of the Universe for Intelligent Life (2012)", publisher: "Luke A. Barnes, Publications of the Astronomical Society of Australia" },
        { title: "The cosmological constant problem (1989)", publisher: "Steven Weinberg, Reviews of Modern Physics" },
      ],
      related: [
        { title: "Can You Believe in God and the Big Bang?", sub: "Faith & Science · 5 min", lessonId: "science-big-bang" },
      ],
      button: "Finish",
    },
  ],
} satisfies Lesson;
