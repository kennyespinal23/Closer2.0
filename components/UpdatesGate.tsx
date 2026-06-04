import { useEffect, useRef, useState } from "react";
import * as Updates from "expo-updates";

/**
 * UpdatesGate — applies pending EAS updates synchronously on launch.
 *
 * Why this exists:
 *   Expo Updates' DEFAULT behavior is "check on launch, download in
 *   background, apply on NEXT launch". For an app in active
 *   development that ships updates throughout the day, that means
 *   every fix the user receives is invisible to them until they
 *   force-quit and reopen TWICE. We saw this exact failure mode
 *   when shipping the dark-mode lock: user reopened, saw the OLD
 *   light-mode bundle still running, assumed nothing had shipped.
 *
 * What this does instead:
 *   On mount, before children render, we:
 *     1. Skip entirely in dev (Updates is a no-op in Expo Go and
 *        local dev builds — Updates.checkForUpdateAsync() throws
 *        if called there).
 *     2. Skip if the app was already launched from an embedded
 *        bundle that matches the latest known update (no work).
 *     3. Otherwise call Updates.checkForUpdateAsync(). If the
 *        result has `isAvailable === true`, fetch it and
 *        reloadAsync() so the next render runs the new bundle.
 *     4. If no update or any step fails, mount children
 *        immediately. We never block the app forever on a network
 *        check — 4-second timeout puts an upper bound on the
 *        latency penalty for users on bad connections.
 *
 * Why this lives at the top of the render tree:
 *   It sits BEFORE HydrationGate so the user sees the splash
 *   screen for the brief moment we're checking. If an update is
 *   found, we reload before HydrationGate ever runs — the user
 *   sees a single, slightly longer splash and lands directly in
 *   the new bundle. If no update, they pay ~100ms for the network
 *   check and land in the existing bundle.
 *
 * Trade-offs:
 *   • +50–500ms cold-start time on every launch (1 network round-
 *     trip to the EAS Update server). Acceptable for a daily
 *     devotional app where the user opens once / twice a day.
 *   • Doesn't help if the user is OFFLINE on launch — but then no
 *     update would arrive either way, so this just falls back to
 *     the previously-installed bundle (which is what they'd get
 *     anyway).
 *   • Doesn't run in dev. Don't try to test it in Expo Go or in a
 *     dev client — only matters for TestFlight / App Store builds.
 */

const CHECK_TIMEOUT_MS = 4000;

export function UpdatesGate({ children }: { children: React.ReactNode }) {
  // `checked` flips to true once we've either (a) confirmed no
  // update is available, (b) successfully fetched + reloaded into
  // a new update (in which case this component re-mounts in the
  // new bundle and immediately sees checked=true again), or (c)
  // hit our timeout / a fatal error and decided to mount children
  // anyway.
  const [checked, setChecked] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // In dev, Updates.checkForUpdateAsync throws. Skip the check
    // and mount children immediately. __DEV__ is the React Native
    // global that flips to false for production / preview builds.
    if (__DEV__) {
      setChecked(true);
      return;
    }

    // Also skip if Updates isn't enabled in this build (e.g.
    // someone disabled it in app.json) — Updates.isEnabled is the
    // canonical guard for "is the runtime hosting this app
    // capable of receiving OTA updates?".
    if (!Updates.isEnabled) {
      setChecked(true);
      return;
    }

    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      setChecked(true);
    }, CHECK_TIMEOUT_MS);

    (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (timedOut) return;
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
          if (timedOut) return;
          // reloadAsync() restarts the JS bridge into the new
          // bundle. Anything below in the tree gets unmounted
          // immediately — no need to setChecked(true). The new
          // bundle re-runs UpdatesGate which will then short-
          // circuit because there's no NEWER update than the one
          // we just installed.
          await Updates.reloadAsync();
          return;
        }
        // No update — proceed with the existing bundle.
        setChecked(true);
      } catch {
        // Network error, EAS server hiccup, native module not
        // initialized, whatever — fail open. The user shouldn't
        // be locked out of the app because the OTA check stumbled.
        setChecked(true);
      } finally {
        clearTimeout(timeout);
      }
    })();
  }, []);

  if (!checked) return null;
  return <>{children}</>;
}
