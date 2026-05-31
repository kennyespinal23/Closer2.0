/**
 * Insights catalog.
 *
 * Magazine-style devotional articles that go deeper than a single
 * verse — short, contemplative explainers on topics that come up in
 * every reader's life (grace, prayer, doubt, etc.).
 *
 * Each insight ships with:
 *   • A typed body — paragraphs, leads, pull-quotes, scripture refs,
 *     and bullet lists. The article renderer maps these block types
 *     to distinct typography so an article reads with structure, not
 *     as a wall of text.
 *   • A category — the index screen groups them by category so the
 *     library feels organized as it grows.
 *   • Optional hero image (PNG in assets/insights/). Until art lands
 *     each article falls back to a soft typographic cover sampled
 *     from `palette` (see articleHeroFallback in the detail screen).
 *
 * Why we ship bodies inline (vs fetch from a CMS):
 *   • Articles work offline.
 *   • Authoring + review happens in this file as a single PR —
 *     content lives next to the code that renders it.
 *   • When/if we need a CMS we can swap the data source without
 *     touching the renderer (the shape stays the same).
 *
 * IMPORTANT — content drift:
 *   The body text below is the user-supplied content from the
 *   product brief. Pieces marked with `// TODO_CONTENT` were cut
 *   off in the original screenshot and need the final 1–2 lines
 *   pasted in before launch. The renderer handles partial articles
 *   gracefully (no broken layout), but the reader will see the
 *   article end abruptly.
 */

import type { ImageSourcePropType } from "react-native";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type InsightCategoryId = "faith-basics";

export type InsightCategory = {
  id: InsightCategoryId;
  /** Display label, e.g. "Faith Basics". */
  label: string;
  /** One-line "what is this rail" subtitle for the index screen. */
  blurb: string;
};

export const INSIGHT_CATEGORIES: ReadonlyArray<InsightCategory> = [
  {
    id: "faith-basics",
    label: "Faith Basics",
    blurb: "Short reads on the words you've heard a hundred times — and what they actually mean.",
  },
] as const;

/**
 * Block-level body shapes. The article renderer (see app/insight/[id].tsx)
 * pattern-matches on `kind` and renders each block with its own
 * typography. Keeping the body as discrete blocks (vs a single rich-text
 * string) makes scripture references tappable and pull-quotes easy
 * to weight visually.
 */
export type InsightBlock =
  /** Standard body paragraph. The most common block. */
  | { kind: "paragraph"; text: string }
  /** A single-sentence statement set apart with size/weight. Use
   *  sparingly — once or twice per article — for the article's hinge. */
  | { kind: "lead"; text: string }
  /** A pull-quote, set off with quotes and an accent stripe. */
  | { kind: "pullQuote"; text: string; attribution?: string }
  /** Inline scripture reference. Tapping opens the chapter reader
   *  with the verse focused + glowed (same as the check-in flow). */
  | {
      kind: "scriptureRef";
      reference: string; // "Hebrews 11:1"
      bookId: string;
      chapter: number;
      verse: number;
      /** Optional verse body for inline quoting. */
      text?: string;
    }
  /** Bullet list. Each item is a short line — bullet glyph is
   *  rendered by the article view (so items stay theme-consistent). */
  | { kind: "bulletList"; items: string[] }
  /** A thin divider rule. */
  | { kind: "divider" };

export type Insight = {
  id: string;
  category: InsightCategoryId;
  title: string;
  /** Magazine-style one-line tease shown under the title + on cards. */
  subtitle: string;
  /** Estimated read time in minutes. */
  readMinutes: number;
  /**
   * Hero illustration. Optional — if absent, the detail screen renders
   * a typographic fallback using `palette` so the article still
   * launches with a strong visual identity.
   */
  hero?: ImageSourcePropType;
  /**
   * True when the hero illustration already includes the title,
   * subtitle, and read-time as part of the artwork (book-cover style).
   *
   * When true:
   *   • The detail screen skips its own title/subtitle/eyebrow block
   *     so the cover isn't doubled in copy
   *   • Rail + featured cards hide their caption strip and let the
   *     cover speak for itself
   *
   * When false / undefined (the default):
   *   • Hero is treated as a decorative illustration and the title
   *     etc. are rendered separately below it
   */
  coverIncludesTitle?: boolean;
  /**
   * Two-stop color palette used for the hero backdrop, the saved-chip
   * tint, and the typographic fallback. Sampled to feel like the
   * article's "mood" (gold for grace, slate for repentance, etc.).
   */
  palette: { bg: string; ink: string; accent: string };
  /** Body, top-to-bottom. */
  body: InsightBlock[];
  /** Ids of other Insights to surface in "You Might Also Like". */
  related: string[];
};

// ─────────────────────────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────────────────────────

export const INSIGHTS: ReadonlyArray<Insight> = [
  {
    id: "what-is-grace",
    category: "faith-basics",
    title: "What Is Grace?",
    subtitle:
      "The most important word in Christianity — and why most people misunderstand it.",
    // Matches the read-time badge baked into the cover artwork. Body
    // is currently ~2 min — bump when the longer Grace content lands.
    readMinutes: 6,
    hero: require("../assets/insights/what-is-grace.png"),
    coverIncludesTitle: true,
    // Palette sampled from the cover artwork:
    //   • bg     — the cover's pale lavender backdrop, used as a
    //              soft tint on scripture-ref cards and saved-chip
    //   • ink    — the deep violet shadow, used for the typographic
    //              fallback letterform (unused while the cover ships)
    //   • accent — the gold ribbon spilling out of the box, used for
    //              the body accent rule, bulleted dots, and Save-tint
    palette: { bg: "#D4B8E6", ink: "#2B1740", accent: "#E8A53C" },
    body: [
      {
        kind: "paragraph",
        text: "Grace is the most used and least understood word in Christianity.",
      },
      {
        kind: "paragraph",
        text: "Ask ten people to define it and you'll get ten different answers. Unmerited favor. God's love. A second chance. Forgiveness.",
      },
      {
        kind: "paragraph",
        text: "All of those are connected to grace. None of them fully capture it.",
      },
      { kind: "paragraph", text: "Here's the simplest way to understand it:" },
      {
        kind: "lead",
        text: "Grace is getting what you don't deserve.",
      },
      {
        kind: "paragraph",
        text: "But even that doesn't go far enough. Because grace isn't just God overlooking what you did wrong. It's God actively moving toward you because of who He is — not because of anything you've done.",
      },
      {
        kind: "paragraph",
        text: "The opposite of grace is karma — the idea that you get what you deserve. Grace says: you deserve judgment, and instead you get love.",
      },
    ],
    related: ["what-is-repentance", "what-is-faith"],
  },

  {
    id: "what-is-repentance",
    category: "faith-basics",
    title: "What Is Repentance?",
    subtitle:
      "It's not what most people think — and it's not as scary as it sounds.",
    // Matches the read-time badge baked into the cover artwork. Body
    // is currently ~2 min — bump when the longer Repentance content
    // lands.
    readMinutes: 6,
    hero: require("../assets/insights/what-is-repentance.png"),
    coverIncludesTitle: true,
    // Palette sampled from the cover artwork (winding orange road
    // toward a glowing sun against a deep night):
    //   • bg     — warm sunset orange, used for scripture-ref tint
    //              and saved-chip background
    //   • ink    — the deep night-sky behind the canyon, used for
    //              the typographic fallback (unused while the cover
    //              ships)
    //   • accent — the bright lit-road orange, drives the body
    //              accent rule, bulleted dots, Save-pill fill, and
    //              the scripture-card border
    palette: { bg: "#C44424", ink: "#0A1118", accent: "#FF6E3D" },
    body: [
      { kind: "paragraph", text: "Repentance has a reputation problem." },
      {
        kind: "paragraph",
        text: "Most people hear the word and picture a street preacher with a sign, or a guilt-ridden person groveling before an angry God.",
      },
      { kind: "paragraph", text: "That's not what repentance is." },
      {
        kind: "paragraph",
        text: "The Greek word is metanoia. It means a change of mind — a fundamental shift in direction. Not just feeling bad about something. Turning around.",
      },
      {
        kind: "paragraph",
        text: "Think of it this way. You're walking down a road. You realize the road leads somewhere you don't want to go. Repentance is the decision to turn around and walk a different direction.",
      },
      { kind: "paragraph", text: "It involves three things:" },
      {
        kind: "bulletList",
        items: [
          "Recognition — seeing clearly what you did and calling it what it is.",
          "Grief — actually caring that it matters, not just that you got caught.",
          // TODO_CONTENT: confirm the third bullet (cut off in source).
          // Most likely: "Redirection — choosing to actually walk a different way, not just regret the old one."
          "Redirection — choosing to actually walk a different way, not just regret the old one.",
        ],
      },
      // TODO_CONTENT: confirm whether the article continues after the
      // three-part list. The source screenshot ended here.
    ],
    related: ["what-is-grace", "what-is-faith"],
  },

  {
    id: "what-is-faith",
    category: "faith-basics",
    title: "What Is Faith?",
    subtitle: "Faith is not the absence of doubt. Here's what it actually is.",
    // Matches the read-time badge baked into the cover artwork. Body
    // is currently ~2 min — bump when the longer Faith content lands.
    readMinutes: 7,
    hero: require("../assets/insights/what-is-faith.png"),
    coverIncludesTitle: true,
    // Palette sampled from the cover artwork (stepping stones over
    // a deep teal void):
    //   • bg     — mid-teal for scripture-ref card tint, sampled
    //              from the brighter path edge on the left
    //   • ink    — the deep teal background, used for the
    //              typographic fallback (unused while the cover ships)
    //   • accent — the bright stone teal — drives the body accent
    //              rule, bulleted dots, Save-pill fill, and the
    //              scripture-card border
    palette: { bg: "#3F8C8B", ink: "#0F2D2E", accent: "#7DD3CD" },
    body: [
      {
        kind: "paragraph",
        text: "Most people define faith as believing something you can't prove.",
      },
      {
        kind: "paragraph",
        text: "That makes faith sound like wishful thinking. Like you're just choosing to believe something nice because the alternative is too hard.",
      },
      { kind: "paragraph", text: "That's not the biblical definition." },
      {
        kind: "scriptureRef",
        reference: "Hebrews 11:1",
        bookId: "hebrews",
        chapter: 11,
        verse: 1,
        text: "Now faith is the substance of things hoped for, the evidence of things not seen.",
      },
      {
        kind: "paragraph",
        text: "Substance. Evidence. Those are not soft words. Those are words that imply something real and present — even if not yet fully visible.",
      },
      {
        kind: "paragraph",
        text: "Faith in scripture is better understood as trust in a person based on what you know about them. Not certainty about outcomes. Trust in character.",
      },
      {
        kind: "paragraph",
        // TODO_CONTENT: confirm the final clause of this paragraph
        // (source cut off after "You act on that trust by"). Filling
        // with the most natural completion of the plane analogy.
        text: "When you get on a plane, you exercise faith. You can't personally verify every system check. You trust based on evidence — the track record of aviation, the training of the crew, the design of the aircraft. You act on that trust by boarding the plane.",
      },
      // TODO_CONTENT: confirm whether the article has additional
      // closing paragraphs after the plane analogy.
    ],
    related: ["what-is-grace", "what-is-prayer"],
  },

  {
    id: "what-is-prayer",
    category: "faith-basics",
    title: "What Is Prayer?",
    subtitle:
      "It's not a formula. It's not a performance. Here's what it actually is.",
    // Read time matches the badge baked into the cover artwork. If
    // the cover ever ships without a baked-in read-time pill, this
    // can drop back to 2 min (matching the body length).
    readMinutes: 6,
    hero: require("../assets/insights/what-is-prayer.png"),
    coverIncludesTitle: true,
    // Palette sampled from the cover artwork:
    //   • bg     — the cover's mid-red sky, used as a soft tint on
    //              scripture-ref cards and the saved chip
    //   • ink    — the deep canyon shadow, used as the typographic
    //              fallback letterform color (unused when the cover
    //              image is present)
    //   • accent — the bright orange sun-glow, used for the body's
    //              accent rule, bulleted dots, and Save-tint
    palette: { bg: "#C53A2A", ink: "#2A0E0C", accent: "#FF6A3A" },
    body: [
      { kind: "paragraph", text: "Prayer has a lot of baggage." },
      {
        kind: "paragraph",
        text: "Most people learned to pray in a specific style — kneeling, eyes closed, certain phrases, a particular format. And when that style doesn't produce the feeling they expected, they conclude either they're doing it wrong or it doesn't work.",
      },
      {
        kind: "lead",
        text: "Here's the simplest definition of prayer: honest conversation with God.",
      },
      {
        kind: "paragraph",
        text: "Not a performance. Not a formula. Not a monologue of requests. A conversation — meaning it involves speaking and listening, honesty and waiting.",
      },
      {
        kind: "paragraph",
        text: "The psalms are the prayer book of scripture. And they include:",
      },
      {
        kind: "bulletList",
        items: [
          "Praise. Gratitude. Wonder at who God is.",
          "Lament. Grief. Honest cries from the pit.",
          "Confusion. Questions without easy answers.",
          "Anger. David was furious with God on multiple occasions and said so.",
          "Trust. The decision to believe even when nothing has changed.",
        ],
      },
      // TODO_CONTENT: confirm whether the article continues with a
      // closing paragraph that ties the list back to the lead.
    ],
    related: ["what-is-faith", "what-is-grace"],
  },
] as const;

// ─────────────────────────────────────────────────────────────────
// Lookups
// ─────────────────────────────────────────────────────────────────

export function findInsight(id: string | null | undefined): Insight | null {
  if (!id) return null;
  return INSIGHTS.find((i) => i.id === id) ?? null;
}

export function findCategory(id: InsightCategoryId): InsightCategory | null {
  return INSIGHT_CATEGORIES.find((c) => c.id === id) ?? null;
}

export function insightsInCategory(id: InsightCategoryId): Insight[] {
  return INSIGHTS.filter((i) => i.category === id);
}

/** Convenience: resolve a list of related ids to Insight objects,
 *  dropping any that don't exist (e.g. removed in a later release). */
export function resolveRelated(ids: ReadonlyArray<string>): Insight[] {
  return ids
    .map((id) => findInsight(id))
    .filter((i): i is Insight => i !== null);
}
