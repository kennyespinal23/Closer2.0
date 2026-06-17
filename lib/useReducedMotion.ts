import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { usePreferences } from "@/state/preferences";

/**
 * `useReducedMotion`
 *
 * Returns `true` when EITHER:
 *   (a) The user has enabled OS-level Reduce Motion
 *       (Settings → Accessibility → Motion → Reduce Motion on
 *       iOS) — read live, flips without a restart when the
 *       system setting changes; OR
 *   (b) The user has flipped Closer's own Reduce Motion override
 *       in Settings → Appearance (the
 *       `reduceMotionOverride` field on the preferences
 *       provider).
 *
 * The OR means the override is strictly ADDITIVE — it can only
 * turn motion off, never override a user who's actively asked the
 * OS to reduce motion. Apple's HIG is firm on this: a per-app
 * setting must not undo an OS accessibility preference. The
 * override exists so a user who finds Closer's specific motions
 * (sermon fades, focus ring breath, count-up reveals) too much
 * can dim them without enabling the global system setting and
 * losing motion across every other app on the device.
 *
 * Use this to gate non-essential motion: ring fill draws, fade-ins,
 * card slide transitions, scrubber pulses, etc. The rule of thumb
 * Apple uses is: if removing the animation breaks the user's
 * understanding of what happened, keep it (and consider replacing
 * the motion with a cross-fade); otherwise snap to the final state.
 *
 * The first render before the async OS query resolves returns the
 * override-only value (false on a fresh install) — we'd rather
 * flash one animated frame than withhold motion from a user who
 * actually wants it. The subscription handler then updates state
 * to the truthful OS value within the first commit, which for
 * SVG/Animated animations is before any visible draw happens
 * anyway.
 *
 * On platforms that don't expose AccessibilityInfo (web, certain
 * test envs), the hook falls back to the override-only path and
 * consumers keep their animations unless the user opted in via
 * the Closer toggle.
 *
 * Hook ordering note: this hook calls `usePreferences()`, which
 * means it MUST be used inside the `<PreferencesProvider>` tree.
 * Every screen and component in Closer renders inside that
 * provider (it's mounted at the root in `app/_layout.tsx`), so
 * the constraint is invisible in practice — but a Storybook
 * harness or test mount that skips the provider will need to
 * wrap with it.
 */
export function useReducedMotion(): boolean {
  const [osReduced, setOsReduced] = useState<boolean>(false);
  const { reduceMotionOverride } = usePreferences();

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setOsReduced(value);
      })
      .catch(() => {
        /* OS query failed — keep motion enabled, the harmless default */
      });

    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        if (mounted) setOsReduced(value);
      },
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return osReduced || reduceMotionOverride;
}

/**
 * `useOsReducedMotion`
 *
 * The same OS-level read as `useReducedMotion` but WITHOUT
 * composing in the Closer-specific override. Use this only when
 * you specifically need to know what the system says (e.g. the
 * Appearance screen, which needs to show the user "iOS Reduce
 * Motion is on" as a force-on/disabled cue independent of their
 * Closer override). Every other consumer of motion-gating should
 * keep using `useReducedMotion()` so the override is respected.
 */
export function useOsReducedMotion(): boolean {
  const [osReduced, setOsReduced] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setOsReduced(value);
      })
      .catch(() => {
        /* OS query failed — keep motion enabled, the harmless default */
      });

    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        if (mounted) setOsReduced(value);
      },
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return osReduced;
}

/**
 * `useHighContrast`
 *
 * Returns `true` when the user has enabled iOS's
 * **Increase Contrast** setting (Settings → Accessibility →
 * Display & Text Size → Increase Contrast), exposed in the React
 * Native bridge as `isDarkerSystemColorsEnabled`.
 *
 * Use this to swap quiet/translucent UI elements (progress
 * tracks, dividers, inset borders, muted background fills) for
 * higher-contrast alternatives when the user has explicitly
 * asked the system to make UI components more legible. Apple's
 * own system controls (UIProgressView, UISwitch, table-row
 * separators, etc.) bump their stroke/track contrast under this
 * setting; consumer apps that hardcode their own colors have to
 * opt into the same response by reading this flag and choosing
 * a brighter value.
 *
 * Mirrors the live-subscription pattern of `useReducedMotion`
 * so the swap happens immediately when the user toggles the
 * setting from Control Center — no app relaunch required.
 *
 * iOS-only signal. On Android the API call resolves to `false`
 * (the platform exposes a separate "High Text Contrast" event
 * that we don't bridge here yet); web/test envs fall through to
 * the same harmless default. That matches our current
 * deployment surface (iOS-only) and we can extend later if we
 * ship Android.
 */
export function useHighContrast(): boolean {
  const [highContrast, setHighContrast] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isDarkerSystemColorsEnabled()
      .then((value) => {
        if (mounted) setHighContrast(value);
      })
      .catch(() => {
        /* OS query failed — keep default contrast, the harmless fallback */
      });

    const sub = AccessibilityInfo.addEventListener(
      "darkerSystemColorsChanged",
      (value) => {
        if (mounted) setHighContrast(value);
      },
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return highContrast;
}
