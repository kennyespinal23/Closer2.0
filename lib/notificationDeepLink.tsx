import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";

/**
 * Hook that wires the "tap notification → open sermon" deep-link
 * for the daily "Before The Noise" reminder.
 *
 * Three paths a tap can arrive on, and we have to handle each:
 *
 *   1. App was KILLED when tapped       → cold start; we read the
 *      response with `getLastNotificationResponseAsync()` once
 *      after mount + hydration are complete.
 *   2. App was BACKGROUND when tapped   → warm start; the OS brings
 *      the app forward and our `addNotificationResponseReceivedListener`
 *      fires.
 *   3. App was FOREGROUND when tapped   → same listener fires; the
 *      foreground display handler in lib/notifications.ts is what
 *      surfaced the banner in the first place.
 *
 * Cold-start handling is the tricky one. expo-router takes a few
 * frames to mount the navigator after JS starts, so we wait until
 * the router is usable. `useRouter().push` is safe to call once the
 * root <Stack> has mounted (which is true by the time this hook
 * runs, since it's mounted inside the layout itself).
 *
 * Why route to `/today`?
 *   The day's card on Home is the experience entry point now.
 *   The old `/sermon/scripture` antechamber is retired.
 */
export function useNotificationDeepLink(): void {
  const router = useRouter();

  // Background / foreground tap listener.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const route = extractRoute(response);
        if (!route) return;
        // `replace` instead of `push` so back navigation from the
        // sermon goes to the home, not to whatever screen happened
        // to be focused when the notification fired.
        router.replace(route);
      },
    );
    return () => sub.remove();
  }, [router]);

  // Cold-start: the OS handed us a notification response *before*
  // the app's JS was even running. We have to ask for it explicitly
  // since we missed the live event. We only consume it once.
  useEffect(() => {
    let cancelled = false;
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (cancelled || !response) return;
      const route = extractRoute(response);
      if (!route) return;
      router.replace(route);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);
}

/** Notification kinds this dispatcher knows how to route. New
 *  kinds get added here AND in the payload-emitting site (see
 *  lib/notifications.ts). Keeping the allow-list narrow means a
 *  malformed or untrusted notification payload can never coerce
 *  the router into navigating to an arbitrary screen. */
const KNOWN_KINDS = new Set([
  "before-the-noise",
  "study-session",
  "shield-return",
]);

/**
 * Read the deep-link route off a notification response's data
 * payload. Returns null when the data shape is unrecognized so the
 * caller can no-op cleanly on stray notifications from older app
 * versions or future kinds we don't know how to handle yet.
 *
 * Both supported kinds carry their own `route` string (set at
 * schedule-time) — that lets a single dispatcher handle multiple
 * notification types without having to know the route conventions
 * of each. The kind check is for safety only (reject unknown
 * payloads), not for routing.
 */
function extractRoute(
  response: Notifications.NotificationResponse,
): Href | null {
  const data = response.notification.request.content.data as
    | { kind?: string; route?: string }
    | undefined;
  if (!data) return null;
  if (typeof data.kind !== "string" || !KNOWN_KINDS.has(data.kind)) {
    return null;
  }
  if (typeof data.route !== "string" || data.route.length === 0) return null;
  // The router accepts string Hrefs at runtime; the cast keeps the
  // typed-routes feature happy without us having to enumerate every
  // possible target in this generic dispatcher.
  return data.route as Href;
}
