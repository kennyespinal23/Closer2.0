import type { ImageSourcePropType } from "react-native";

/**
 * The ten sermon types that rotate through the app.
 *
 * Each entry carries:
 *   - id:         stable slug used in URLs, analytics, etc.
 *   - displayNum: the "01"–"10" badge from the design system.
 *   - name:       human-readable title.
 *   - tagline:    the short voice line from the source artwork
 *                 (e.g. "The lie. Then the truth."). Used as a
 *                 subhead on cards.
 *   - description: longer copy shown on the sermon intro screen
 *                 to set expectations before the user begins.
 *   - accent:     a hex color sampled from the icon, used to
 *                 tint the soft glow behind the hero so each
 *                 sermon intro feels distinct.
 *   - hero:       require()'d PNG cropped from the composite.
 *
 * Keep this list ordered to match the design plate — the daily
 * rotation indexes into it directly.
 */
export type SermonType = {
  id: string;
  displayNum: string;
  name: string;
  tagline: string;
  description: string;
  accent: string;
  hero: ImageSourcePropType;
};

export const SERMON_TYPES: readonly SermonType[] = [
  {
    id: "daily-church",
    displayNum: "01",
    name: "Daily Church",
    tagline: "The heartbeat of the app.",
    description:
      "A short, daily teaching to draw you near. The kind of word you'd hear on a Sunday morning — but for the middle of your week.",
    accent: "#FF8B3D",
    hero: require("../assets/sermon-types/daily-church.png"),
  },
  {
    id: "jesus-only",
    displayNum: "02",
    name: "Jesus Only",
    tagline: "No noise. Just Him.",
    description:
      "No commentary. No application points. Just the words and presence of Jesus, held up to the light.",
    accent: "#7A5CFF",
    hero: require("../assets/sermon-types/jesus-only.png"),
  },
  {
    id: "letters-struggling",
    displayNum: "03",
    name: "Letters From A Struggling Christian",
    tagline: "A letter found in someone's journal.",
    description:
      "An unguarded letter from someone in the middle of doubt, exhaustion, or distance. You might recognize the handwriting.",
    accent: "#9C5CE5",
    hero: require("../assets/sermon-types/letters-struggling.png"),
  },
  {
    id: "letters-grateful",
    displayNum: "04",
    name: "Letters From A Grateful Christian",
    tagline: "The same voice — from the other side.",
    description:
      "A letter from someone who made it through. Less polished than a testimony — more like a thank-you note to God.",
    accent: "#E64539",
    hero: require("../assets/sermon-types/letters-grateful.png"),
  },
  {
    id: "character-studies",
    displayNum: "05",
    name: "Character Studies",
    tagline: "Emotional storytelling through a biblical figure.",
    description:
      "Step into the life of someone in Scripture — what they felt, what they feared, and how God met them there.",
    accent: "#2FB8A0",
    hero: require("../assets/sermon-types/character-studies.png"),
  },
  {
    id: "deep-verse",
    displayNum: "06",
    name: "Deep Verse Studies",
    tagline: "A familiar scripture — seen for the first time.",
    description:
      "A single verse you've read a hundred times, opened slowly enough to actually see.",
    accent: "#56C5B7",
    hero: require("../assets/sermon-types/deep-verse.png"),
  },
  {
    id: "misconceptions",
    displayNum: "07",
    name: "Misconceptions",
    tagline: "The lie. Then the truth.",
    description:
      "The half-true thing you've believed about God or yourself — held next to what He actually said.",
    accent: "#34BFB1",
    hero: require("../assets/sermon-types/misconceptions.png"),
  },
  {
    id: "testimonies",
    displayNum: "08",
    name: "Testimonies",
    tagline: "God is still moving today.",
    description:
      "Real stories from real people. Proof that God didn't stop working when the New Testament closed.",
    accent: "#6BCC4D",
    hero: require("../assets/sermon-types/testimonies.png"),
  },
  {
    id: "questions",
    displayNum: "09",
    name: "Questions People Are Afraid To Ask",
    tagline: "The real question — stated directly.",
    description:
      "The hard, honest question — asked out loud, answered without flinching, treated like the holy thing it is.",
    accent: "#7A5CFF",
    hero: require("../assets/sermon-types/questions.png"),
  },
  {
    id: "prayer-nights",
    displayNum: "10",
    name: "Prayer Nights",
    tagline: "Almost no prose. Just presence.",
    description:
      "Less reading, more breathing. A guided prayer rhythm to soften your heart before you sleep.",
    accent: "#4F7CFF",
    hero: require("../assets/sermon-types/prayer-nights.png"),
  },
];

/**
 * Returns today's sermon type using a deterministic day-of-year rotation.
 *
 * The same user opening the app at 9am and 9pm on the same day sees the
 * same type. Tomorrow they see the next one. After 10 days the cycle
 * resets — over a year, each type lands on ~36 different days.
 *
 * A real implementation will eventually be backend-driven (per-user
 * personalization, scheduled drops, etc). This is enough to make the
 * rotation feel alive while we're still designing.
 */
export function getTodaysSermonType(now: Date = new Date()): SermonType {
  const start = new Date(now.getFullYear(), 0, 0);
  const diffMs = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diffMs / 86_400_000);
  const idx = ((dayOfYear % SERMON_TYPES.length) + SERMON_TYPES.length) %
    SERMON_TYPES.length;
  return SERMON_TYPES[idx]!;
}

export function getSermonTypeById(id: string): SermonType | undefined {
  return SERMON_TYPES.find((t) => t.id === id);
}
