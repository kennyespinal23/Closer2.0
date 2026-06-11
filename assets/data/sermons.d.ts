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
 */

import type { ImageSourcePropType } from "react-native";

/** One in-sermon panel. Five per sermon, in canonical order:
 *  Hook → Story → Turn → Landing → Prayer. */
export type SermonPanel = {
  /** 1-based ordinal (1..5). Doubles as the URL segment for
   *  the dynamic route at `/sermon/panel/[id]`. */
  id: number;
  /** Display label shown above the body, e.g. `"The Hook"`,
   *  `"The Story"`, `"Prayer"`. */
  label: string;
  /** True on the closing panel (always `id: 5`). Drives the
   *  blue/atmospheric treatment for prayers; everything else
   *  uses the per-sermon-type accent. */
  isPrayer: boolean;
  /** Panel copy. May contain blank-line paragraph breaks (`\n\n`)
   *  that the renderer splits on to format multi-paragraph beats. */
  body: string;
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
  /** Unsplash search query for the daily scripture screen
   *  backdrop, e.g. `"misty fog empty forest morning"`. Used
   *  by `services/unsplashService.js`'s `getDailyImage()` to
   *  fetch a fresh portrait photo per (day, calendar-date)
   *  pair, replacing the bundled sky.jpg backdrop.
   *
   *  Optional defensively — all 90 entries in the current
   *  catalog have this field, but typing it as required
   *  would make a single missing entry crash the daily flow. */
  imageQuery?: string;
  /** Attributed voice (speaker), e.g. `"Matt Chandler"`. */
  voice: string;
  /** Single string that bundles the reference + verse text,
   *  separated by an em-dash, e.g.
   *  `"John 11:21 — 'Lord, if You had been here…'"`.
   *  Use `splitScripture()` in lib/moments to break it apart. */
  scripture: string;
  /** Always 5 entries, in the canonical Hook → Prayer order. */
  panels: SermonPanel[];
  /** OPTIONAL per-sermon hero illustration. When present, the home
   *  card / intro screen / narrative panels render THIS image
   *  instead of the sermon-type's default `illustration`. Used to
   *  give an individual sermon its own face when the generic
   *  type-level art doesn't carry the topic strongly enough
   *  (e.g. "When God Feels Silent" — a phone receiver calling
   *  into a glowing void — works better than the Daily Church
   *  cross-on-mountain for that specific story).
   *
   *  Path conventions live in `assets/sermon-types/illustrations/`
   *  alongside the type-level art. Same portrait ~1:1.6 shape so
   *  it can drop into all three render slots without re-cropping. */
  illustration?: ImageSourcePropType;
};

/** The catalog. The runtime guarantees:
 *   - exactly 90 entries (Day 1 → Day 90)
 *   - `day` is the array index + 1
 *   - every entry has exactly 5 `panels`
 *   - the last panel is always `isPrayer: true` */
export const SERMONS: SermonRecord[];
