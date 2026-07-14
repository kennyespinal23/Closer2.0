/**
 * Shared spacing / sizing scale for Closer UI chrome.
 *
 * The primary scale is the common 4pt layout convention
 * (4 / 8 / 12 / 16 / 24 / 32 / 40 / 48) — an internal product
 * standard for new work, not a literal Apple HIG rule.
 *
 * Apple *does* require a separate touch-target floor:
 * every interactive control must be at least 44×44pt
 * (`minTouchTarget`). That is documented HIG, not convention.
 *
 * Prefer `spacing` / `space` / `minTouchTarget` for anything new.
 * Reach for `spacingLegacy` only when migrating existing chrome
 * where rewriting would be noise.
 *
 * Usage:
 *   import { spacing, space, minTouchTarget } from "@/constants/spacing";
 *   style={{ paddingHorizontal: spacing[16], gap: spacing[12] }}
 *   style={{ minWidth: minTouchTarget, minHeight: minTouchTarget }}
 */

/**
 * Primary spacing scale — single source of truth for new UI.
 * Do not add half-steps here; constrain layouts to these values.
 */
export const spacing = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
} as const;

export type SpacingToken = keyof typeof spacing;

/**
 * Named aliases for the primary scale (intent over bare numbers).
 */
export const space = {
  /** Dense chip / hairline stack. */
  xs: spacing[4],
  /** Default related-item gap. */
  sm: spacing[8],
  /** Sheet / list related gap. */
  md: spacing[12],
  /** Standard horizontal page inset. */
  lg: spacing[16],
  /** Primary CTA / section separation. */
  xl: spacing[24],
  /** Large section gap; sheet bottoms. */
  "2xl": spacing[32],
  /** Wide gutter. */
  "3xl": spacing[40],
  /** Hero / page-edge inset. */
  "4xl": spacing[48],
} as const;

/**
 * Apple HIG minimum hit area for interactive controls (44×44pt).
 * Not part of the spacing scale — a documented accessibility floor.
 * Pair with `hitSlop` when the visual element is smaller than this.
 */
export const minTouchTarget = 44;

/**
 * @deprecated Legacy half-steps found in existing screens.
 * Kept only to avoid noisy rewrites during migration.
 * Do **not** use in new code — snap up/down to `spacing` instead.
 *
 * | Legacy | Prefer instead      |
 * | ------ | ------------------- |
 * | 2      | spacing[4]          |
 * | 6      | spacing[4] or [8]   |
 * | 10     | spacing[8] or [12]  |
 * | 14     | spacing[12] or [16] |
 * | 20     | spacing[16] or [24] |
 * | 28     | spacing[24] or [32] |
 */
export const spacingLegacy = {
  2: 2,
  6: 6,
  10: 10,
  14: 14,
  20: 20,
  28: 28,
} as const;

export type SpacingLegacyToken = keyof typeof spacingLegacy;
