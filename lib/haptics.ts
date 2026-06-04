/**
 * Haptics — small wrapper around expo-haptics that gives the rest
 * of the app a vocabulary of semantic taps rather than raw
 * `ImpactFeedbackStyle.*` calls scattered through every Pressable.
 *
 * Premium apps haptic-tick on every meaningful interaction. The
 * key word is "meaningful" — generic scroll taps shouldn't fire
 * (it gets annoying fast and drains battery), but CTAs, state
 * transitions, and rewarding moments should.
 *
 * Vocabulary:
 *   • soft()     — light touch confirmation. Default for non-CTA
 *                  taps (rows, chips, secondary actions). Reads as
 *                  "I heard you".
 *   • tap()      — primary CTA confirmation. Medium impact. For
 *                  the Begin sermon button, "+ Focus", and other
 *                  intentional commits.
 *   • success()  — celebration. Used on streak increment, daily
 *                  goal hit, sermon complete. The OS notification
 *                  success pattern is two short pulses, which the
 *                  user already associates with "thing accomplished".
 *   • warn()     — gentle attention pull. Used on confirmation
 *                  dialogs (e.g., "End focus session?").
 *
 * All calls are .catch(() => {}) silenced — haptics are nice-to-
 * have, never load-bearing. If the device or OS rejects the call
 * (Android without vibration permission, simulator without haptic
 * support), the app continues as if it never fired.
 */
import * as Haptics from "expo-haptics";

export function soft() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
    /* haptic call is best-effort */
  });
}

export function tap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
    /* haptic call is best-effort */
  });
}

export function success() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {
      /* haptic call is best-effort */
    },
  );
}

export function warn() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
    () => {
      /* haptic call is best-effort */
    },
  );
}
