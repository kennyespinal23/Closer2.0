/**
 * Type declaration for `sermons.js`.
 *
 * The sermon vault ships as a `.js` module (authored by hand,
 * not generated) so the content team can edit it without leaving
 * the codebase. This file describes the shape so `lib/moments.ts`
 * can consume the import with proper type-safety.
 *
 * Keep this in sync with the data: if a future revision adds a
 * field to each sermon or to each panel, mirror it here.
 *
 * ─── June 2026 schema reset ─────────────────────────────────────
 * The earlier schema carried four fields that have been removed
 * with the catalog rewrite:
 *
 *   • `voice`        — pastor attribution ("Matt Chandler"). The
 *                       sermons aren't truly authored by named
 *                       pastors, so surfacing the attribution as
 *                       "Sermon by …" was misleading. Removed
 *                       everywhere.
 *   • `blurb`        — short hook paragraph for the home card.
 *   • `closer`       — bold one-line invitation under the blurb.
 *                       Both `blurb` and `closer` collapsed into
 *                       the single `teaser` field below; the home
 *                       card renders the teaser's first paragraph
 *                       as the new editorial preview.
 *   • `imageQuery`   — Unsplash search query for per-sermon
 *                       scripture backdrops. The new catalog
 *                       ships without these; the field is kept
 *                       OPTIONAL on the type so the scripture
 *                       screen's existing Unsplash fallback path
 *                       still type-checks, and so future per-
 *                       sermon queries can be reintroduced
 *                       without another schema migration.
 *   • `illustration` — per-sermon hero image override. Kept
 *                       optional for the same reason as
 *                       `imageQuery` (V2 may reintroduce per-
 *                       sermon artwork).
 *
 * Two fields are NEW:
 *
 *   • Sermon-level `teaser` (required) — the single editorial
 *     hook that replaces both `blurb` and `closer`. May contain
 *     `\n\n` paragraph breaks; the home card renders the first
 *     paragraph and the saved-sermon view shows the whole thing.
 *
 *   • Panel-level `practiceToday` (optional) — body copy for the
 *     swipe-up "Practice Today" card that appears on Panel 4
 *     (The Landing) before the prayer. May use the `[name]`
 *     placeholder, which the renderer interpolates with the
 *     user's first name from preferences (falling back to
 *     "friend"). Optional because earlier panels (Hook / Story /
 *     Turn / Prayer) never carry this field.
 */

import type { ImageSourcePropType } from "react-native";

/** One in-sermon panel. Five per sermon, in canonical order:
 *  Hook → Story → Turn → Landing → Prayer. */
export type SermonPanel = {
  /** 1-based ordinal (1..5). Doubles as the URL segment for
   *  the dynamic route at `/sermon/panel/[id]`. */
  id: number;
  /** Display label shown above the body, e.g. `"The Hook"`,
   *  `"The Story"`, `"The Prayer"`. */
  label: string;
  /** True on the closing panel (always `id: 5`). Drives the
   *  prayer-specific treatment; everything else uses the
   *  per-sermon-type accent. */
  isPrayer: boolean;
  /** Panel copy. May contain blank-line paragraph breaks (`\n\n`)
   *  that the renderer splits on to format multi-paragraph beats.
   *  May also contain inline emphasis markers (`**bold**`,
   *  `*italic*`, `***both***`) — see `lib/inlineEmphasis.ts`. */
  body: string;
  /** OPTIONAL "Practice Today" copy, present only on Panel 4
   *  (The Landing). Renders as a swipe-up card pinned to the
   *  bottom of the Landing screen — the user swipes up (or taps
   *  the handle) to reveal the practice, then either swipes
   *  the card back down or taps "Continue to prayer" to advance
   *  to Panel 5 (The Prayer).
   *
   *  May contain the literal `[name]` token, which the renderer
   *  interpolates with the user's first name from preferences
   *  (or "friend" when no name is on file). May contain `\n\n`
   *  paragraph breaks the same as `body`. */
  practiceToday?: string;
};

/** One day's complete sermon — five panels + metadata. */
export type SermonRecord = {
  /** 1-based day in the catalog (1..90). Stable across renders;
   *  used as the lookup key + dev navigation cursor. */
  day: number;
  /** Sermon-type display name straight from the JS (e.g.
   *  `"Daily Church"`, `"Letters - Struggling"`). Resolved to a
   *  structured `SermonType` by `resolveSermonType()`. */
  type: string;
  /** Title of the sermon, e.g. `"When God Feels Silent"`. */
  title: string;
  /** Single string that bundles the reference + verse text,
   *  separated by an em-dash, e.g.
   *  `"John 11:21 — 'Lord, if You had been here…'"`.
   *  Use `splitScripture()` in lib/moments to break it apart. */
  scripture: string;
  /** Editorial hook for the home card and the saved-sermon
   *  detail. May contain `\n\n` paragraph breaks; the home card
   *  renders ONLY the first paragraph as a tight preview, while
   *  the saved-sermon view shows the whole thing. Replaces the
   *  previous `blurb` + `closer` two-field pattern. */
  teaser: string;
  /** Always 5 entries, in the canonical Hook → Prayer order. */
  panels: SermonPanel[];
  /** OPTIONAL per-sermon Unsplash search query for the scripture
   *  screen backdrop. The new catalog ships without these — the
   *  scripture screen falls back to a solid dark canvas when the
   *  field is absent. Kept optional on the type so future
   *  authoring can re-introduce per-sermon backdrops without a
   *  schema migration. */
  imageQuery?: string;
  /** OPTIONAL per-sermon hero illustration override. When
   *  present, the home card / intro / panel screens render THIS
   *  asset instead of the sermon-type's default. The new catalog
   *  ships without per-sermon art (V1 leans on type-level art
   *  alone), but the field is kept for the V2 illustration pass. */
  illustration?: ImageSourcePropType;
};

/** The catalog. The runtime guarantees:
 *   - exactly 90 entries (Day 1 → Day 90)
 *   - `day` is the array index + 1
 *   - every entry has exactly 5 `panels`
 *   - panel 4 (The Landing) carries an optional `practiceToday`
 *   - the last panel is always `isPrayer: true` */
export const SERMONS: SermonRecord[];
