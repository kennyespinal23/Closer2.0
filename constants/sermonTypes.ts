import type { ImageSourcePropType } from "react-native";
import type { SFSymbol as SFSymbolName } from "sf-symbols-typescript";

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
 *   - hero:       The compact glyph illustration. This is the
 *                 "icon" version — small composition cropped from
 *                 the composite plate, intended for tight spots:
 *                 notification thumbnails, milestone summaries,
 *                 small list rows. Rendered CENTERED and CONTAINED
 *                 (not full-bleed) on whatever surface it appears.
 *   - homeHero:   OPTIONAL larger landscape artwork meant to be
 *                 rendered FULL-BLEED behind the home-screen
 *                 hero card. Wider/atmospheric where `hero` is
 *                 dense/glyphic. When absent, the home SermonCard
 *                 falls back to the centered `hero` icon with the
 *                 colored accent-glow treatment.
 *                 First type to ship this is Daily Church; each
 *                 other type can add its own here over time
 *                 without any call-site changes.
 *   - illustration: OPTIONAL portrait "tarot card" artwork —
 *                 self-contained illustration on its own background
 *                 gradient, ~1:1.6 aspect, designed to render as a
 *                 standalone hero centered on the home screen.
 *                 Distinct from `hero` (small icon glyph, no
 *                 background) and `homeHero` (landscape full-bleed
 *                 strip): when `illustration` is present the home
 *                 SermonCard renders a third layout — a tall
 *                 portrait card centered in the hero region. Used
 *                 to test richer, story-forward art without
 *                 retiring the existing two slots.
 *                 First batch to ship this is the 10-card v2
 *                 illustration set (see assets/sermon-types/
 *                 illustrations/). Render priority on the home is:
 *                 illustration > homeHero > hero+accent halo.
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
  homeHero?: ImageSourcePropType;
  illustration?: ImageSourcePropType;
  /**
   * SF Symbol that semantically represents the type. Used as a
   * compact category marker wherever a type is surfaced inline
   * (home screen type chip, sermon intro eyebrow, library row
   * leading glyph). Chosen so each type has an instantly
   * recognizable native-iOS glyph instead of bespoke iconography:
   *
   *   daily-church       → building.columns.fill (chapel/temple)
   *   jesus-only         → sparkles               (presence, light)
   *   letters-struggling → envelope.fill          (a letter)
   *   letters-grateful   → envelope.fill          (a letter)
   *   character-studies  → person.2.fill          (biblical figures)
   *   deep-verse         → book.closed.fill       (scripture)
   *   misconceptions     → lightbulb.fill         (the "ohhh" moment)
   *   testimonies        → quote.bubble.fill      (real stories)
   *   questions          → questionmark.circle.fill (the asked thing)
   *   prayer-nights      → moon.stars.fill        (before sleep)
   *
   * Typed against `sf-symbols-typescript` so call sites get TS
   * autocomplete for the full SF Symbol catalog.
   */
  iconSymbol?: SFSymbolName;
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
    // Landscape sunset with a chapel on a distant hill and a
    // winding road leading up to it. Visually evokes "the path
    // toward Sunday in the middle of your week" — the same line
    // the type's description carries. Used full-bleed behind the
    // home hero card; the small `hero` glyph above stays the
    // notification + milestone-screen asset.
    homeHero: require("../assets/sermon-types/daily-church-home-hero.png"),
    // Portrait "playing card" illustration — cross atop a
    // winding mountain path. Same metaphor as the homeHero (the
    // climb toward Sunday) but rendered as a self-contained
    // story-forward card the home screen can show centered when
    // the illustration render mode is active.
    illustration: require("../assets/sermon-types/illustrations/cross-mountain.jpg"),
    iconSymbol: "building.columns.fill",
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
    // Hands cupped around a rising sun — the only object in
    // frame. Matches the type's "just His presence, nothing
    // else" voice line.
    illustration: require("../assets/sermon-types/illustrations/hands-sun.jpg"),
    iconSymbol: "sparkles",
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
    // A single paper boat on dark waves — "alone in rough
    // waters." Reads as the small, fragile voice mid-doubt
    // that the type's letters narrate.
    illustration: require("../assets/sermon-types/illustrations/boat-ocean.jpg"),
    iconSymbol: "envelope.fill",
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
    // A heart blooming from a flower — gratitude that grew. The
    // visual counterpart to the struggling-letters boat.
    illustration: require("../assets/sermon-types/illustrations/heart-flower.jpg"),
    iconSymbol: "envelope.fill",
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
    // Group of figures together — "stepping into the life of
    // someone in Scripture." People in the frame for a people-
    // forward type.
    illustration: require("../assets/sermon-types/illustrations/family.jpg"),
    iconSymbol: "person.2.fill",
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
    // Open book on warm sky — the most literal pairing in the
    // batch. The text itself, slowed down.
    illustration: require("../assets/sermon-types/illustrations/open-book.jpg"),
    iconSymbol: "book.closed.fill",
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
    // Lightbulb on deep violet — the "ohhhh" moment, the lie
    // flipping to truth.
    illustration: require("../assets/sermon-types/illustrations/lightbulb.jpg"),
    iconSymbol: "lightbulb.fill",
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
    // Small chapel on a green hill at sunrise — real places
    // where real stories happen. Pairs with the type's "God
    // didn't stop moving" line.
    illustration: require("../assets/sermon-types/illustrations/chapel-hill.jpg"),
    iconSymbol: "quote.bubble.fill",
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
    // An open doorway with a path winding off behind it — the
    // hard question itself, framed as a threshold to walk
    // through instead of a wall to bounce off.
    illustration: require("../assets/sermon-types/illustrations/doorway-path.jpg"),
    iconSymbol: "questionmark.circle.fill",
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
    // Crescent moon over deep-blue clouds — the literal time of
    // day this type is meant for. Matches the "before you
    // sleep" closing line of the description.
    illustration: require("../assets/sermon-types/illustrations/moon-stars.jpg"),
    iconSymbol: "moon.stars.fill",
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
