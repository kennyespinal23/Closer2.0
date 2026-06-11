import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * `useReducedMotion`
 *
 * Returns `true` when the user has enabled OS-level Reduce Motion
 * (Settings → Accessibility → Motion → Reduce Motion on iOS). The
 * value updates LIVE — toggling the system setting while Closer
 * is running flips the hook's return value without a restart, the
 * same way Apple's own apps respond.
 *
 * Use this to gate non-essential motion: ring fill draws, fade-ins,
 * card slide transitions, scrubber pulses, etc. The rule of thumb
 * Apple uses is: if removing the animation breaks the user's
 * understanding of what happened, keep it (and consider replacing
 * the motion with a cross-fade); otherwise snap to the final state.
 *
 * The first render before the async OS query resolves returns the
 * "motion enabled" default (false) — we'd rather flash one animated
 * frame than withhold motion from a user who actually wants it. The
 * subscription handler then updates state to the truthful value
 * within the first commit, which for SVG/Animated animations is
 * before any visible draw happens anyway.
 *
 * On platforms that don't expose AccessibilityInfo (web, certain
 * test envs), the hook simply returns `false` forever and consumers
 * keep their animations.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduced(value);
      })
      .catch(() => {
        /* OS query failed — keep motion enabled, the harmless default */
      });

    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => {
        if (mounted) setReduced(value);
      },
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
