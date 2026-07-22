/**
 * Uniform darken wash over photography when white text sits on the
 * image. Calibrated so even a pure-white photo pixel lands at or
 * under {@link PHOTO_BRIGHTNESS_CEILING} (0–255), giving #FFFFFF
 * text ≥ 4.5:1 everywhere without position-dependent scrims.
 *
 *   out = source × (1 − α)           // black overlay, src-over
 *   255 × (1 − α) ≤ 110  →  α ≥ 1 − 110/255 ≈ 0.5686
 */
export const PHOTO_BRIGHTNESS_CEILING = 110;

export const PHOTO_DIM_OVERLAY_ALPHA =
  1 - PHOTO_BRIGHTNESS_CEILING / 255;

export const PHOTO_DIM_OVERLAY = `rgba(0, 0, 0, ${PHOTO_DIM_OVERLAY_ALPHA})`;

/** Pure white — required partner to {@link PHOTO_DIM_OVERLAY}. */
export const PHOTO_OVERLAY_INK = "#FFFFFF";

/** Secondary label on dimmed photos (reference, hints). */
export const PHOTO_OVERLAY_INK_MUTED = "rgba(255, 255, 255, 0.85)";

/** Frosted white chrome pill — completed-sermons screen, etc. */
export const FROSTED_CHROME_PILL = {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: "rgba(255,255,255,0.92)",
  alignItems: "center" as const,
  justifyContent: "center" as const,
};

export const FROSTED_CHROME_INK = "#1C1C1E";

/** Dark glass disc — home + scripture floating chrome over photos. */
export const HERO_GLASS_DISC = {
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  backgroundColor: "rgba(0, 0, 0, 0.65)",
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.22)",
};

/** Uniform dim wash over full-bleed sermon photography (legacy). Prefer {@link PHOTO_DIM_OVERLAY}. */
export const HERO_DIM_OVERLAY = PHOTO_DIM_OVERLAY;

/**
 * Bottom text scrim for the home featured hero — transparent at the
 * top so photography stays full-brightness, ramping to ~65% black at
 * the base where title / metadata / body / CTA sit.
 */
export const HERO_TEXT_SCRIM_GRADIENT = {
  /** Gradient begins fading in at this fraction from the top (0–1). */
  fadeStart: 0.45,
  /** Fully opaque scrim target at the bottom edge. */
  bottomOpacity: 0.68,
  /** Mid-ramp stop between fade start and bottom. */
  midOpacity: 0.58,
  midOffset: 0.82,
} as const;

/** iOS system green — "Read Again" / completed sermon CTA. */
export const COMPLETED_READ_GREEN = "#34C759";

/**
 * Primary pill fill/ink — kept in sync with `CLOSER_ACCENT` in
 * theme.ts. PrimaryPillButton prefers importing CLOSER_ACCENT
 * directly; these aliases remain for call sites that still
 * reference the heroChrome tokens.
 */
export { CLOSER_ACCENT as PRIMARY_PILL_BG } from "@/constants/theme";
export const PRIMARY_PILL_INK = "#FFFFFF";

export const PRIMARY_PILL_SHADOW = {
  shadowColor: "#000000",
  shadowOpacity: 0.12,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4 as const,
};
