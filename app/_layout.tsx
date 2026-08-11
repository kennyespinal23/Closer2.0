import "../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, ShantellSans_700Bold } from "@expo-google-fonts/shantell-sans";
// Interface + reading live on iOS system fonts (SF Pro / New York).
// Shantell Sans Bold is the only bundled face — home quote body.
// See lib/typography.ts + components/HomeQuoteText.tsx.
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LaunchSplash } from "@/components/LaunchSplash";
import { ScheduledBlockGuard } from "@/components/ScheduledBlockGuard";
import { UpdatesGate } from "@/components/UpdatesGate";
import {
  configureForegroundDisplay,
  ensureAndroidChannel,
} from "@/lib/notifications";
import { useNotificationDeepLink } from "@/lib/notificationDeepLink";
import { AuthProvider, useAuth } from "@/state/auth";
import { SubscriptionProvider } from "@/state/subscription";
import { AnnotationsProvider, useAnnotations } from "@/state/annotations";
import { CheckInsProvider, useCheckIns } from "@/state/checkIns";
import { DevToolsProvider, useDevTools } from "@/state/devTools";
import { FocusProvider, useFocus } from "@/state/focus";
import { MomentsProvider, useMoments } from "@/state/moments";
import { OnboardingProvider, useOnboarding } from "@/state/onboarding";
import { PreferencesProvider, usePreferences } from "@/state/preferences";
import { ProgressProvider, useProgress } from "@/state/progress";
import {
  ReadingGoalProvider,
  useReadingGoal,
} from "@/state/readingGoal";
import {
  SavedInsightsProvider,
  useSavedInsights,
} from "@/state/savedInsights";
import { SavedSermonsProvider } from "@/state/savedSermons";
import {
  StudySessionsProvider,
  useStudySessions,
} from "@/state/studySessions";
import { ThemeProvider, useTheme, useColors } from "@/state/theme";

SplashScreen.preventAutoHideAsync().catch(() => {
  /* splash screen may already be hidden; safe to ignore */
});

// Configure how the OS surfaces notifications while the app is
// foregrounded. Called at module-load (before any React renders) so
// any notifications that arrive between JS-start and first-render
// are still displayed. See lib/notifications.ts for rationale.
configureForegroundDisplay();
// Android channel setup — no-op on iOS, idempotent on Android.
ensureAndroidChannel().catch(() => {
  /* channel creation is best-effort */
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ShantellSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // ThemeProvider sits OUTSIDE every other provider so the CSS
  // variables it sets via `vars()` reach every Tailwind class in
  // the tree. The flex:1 root keeps the canvas painted with the
  // active background while children mount.
  //
  // UpdatesGate sits at the very top so EAS Updates are applied
  // SYNCHRONOUSLY on launch instead of the default "download in
  // background, apply on next launch" behavior. Critical for
  // shipping fixes — without this, every hotfix took two cold
  // launches to actually run on the user's device (the first
  // launch downloads the bundle; the second launch boots into
  // it). With this in place, one launch = latest bundle. See
  // components/UpdatesGate.tsx for the trade-offs.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UpdatesGate>
      <ThemeProvider>
        <AuthProvider>
        <SubscriptionProvider>
        <OnboardingProvider>
          <PreferencesProvider>
            <AnnotationsProvider>
              <ProgressProvider>
                <CheckInsProvider>
                  {/* MomentsProvider reads from CheckIns so it has
                      to sit INSIDE it. The provider is read by
                      the home card + every sermon screen, so it
                      needs to be hydrated before AppShell mounts. */}
                  <MomentsProvider>
                    <ReadingGoalProvider>
                      <SavedInsightsProvider>
                        {/* SavedSermonsProvider mirrors
                            SavedInsightsProvider — a thin
                            persisted-bookmarks store keyed by
                            catalog day. Sits beside its sibling
                            so the two saved-content surfaces
                            (insights / sermons) share the same
                            tree position. */}
                        <SavedSermonsProvider>
                        {/* FocusProvider sits inside MomentsProvider
                            because a focus session is conceptually
                            scoped to today's moment (we stamp the
                            sermonDay on the session). It's the
                            innermost provider — none of the others
                            read its state, and putting it here keeps
                            unrelated providers off its re-render
                            path when a session starts/ends. */}
                        <FocusProvider>
                          {/* StudySessionsProvider sits inside
                              FocusProvider because the study
                              landing screen reads focus prefs to
                              decide whether to offer Focus mode
                              on Begin. The reverse (focus needing
                              study) is never true. Putting it
                              here also keeps the daily-providers
                              tree above unaware of scheduling
                              concerns. */}
                          <StudySessionsProvider>
                            {/* DevToolsProvider is the innermost
                                consumer-side provider: it backs a
                                single tiny boolean and nothing else
                                in the tree reads it except the Today
                                screen + the Developer settings page.
                                Sitting at the very inside keeps
                                every other provider's re-render
                                path off of dev-tools state changes. */}
                            <DevToolsProvider>
                              <HydrationGate>
                                <AppShell />
                              </HydrationGate>
                            </DevToolsProvider>
                          </StudySessionsProvider>
                        </FocusProvider>
                        </SavedSermonsProvider>
                      </SavedInsightsProvider>
                    </ReadingGoalProvider>
                  </MomentsProvider>
                </CheckInsProvider>
              </ProgressProvider>
            </AnnotationsProvider>
          </PreferencesProvider>
        </OnboardingProvider>
        </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
      </UpdatesGate>
    </GestureHandlerRootView>
  );
}

/**
 * The visible app shell — Stack navigator + StatusBar.
 *
 * Lives in its own component so we can call `useColors()` /
 * `useResolvedScheme()` from inside the ThemeProvider, which lets
 * the screen background and status bar style flip with the active
 * theme without a re-render of the entire RootLayout.
 */
function AppShell() {
  const colors = useColors();
  const { scheme } = useTheme();

  return (
    <>
      {/* Status bar style flips with the resolved scheme so the
          time/battery glyphs stay legible against the active
          background (light glyphs on dark, dark glyphs on light). */}
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {/* Notification deep-link wiring. Lives INSIDE the
          HydrationGate so the navigator is mounted and the
          app shell is hydrated before we try to route on a
          cold-start notification tap. See
          lib/notificationDeepLink.tsx for the three paths
          this handles (cold / warm / foreground). */}
      <NotificationDeepLinkHandler />
      <ScheduledBlockGuard />
      {/* LaunchSplash — orange brand canvas + white Closer
          wordmark. Sits as an absolutely-positioned overlay
          above the entire navigator and self-unmounts once its
          fade-in / hold / fade-out choreography completes. The
          native splash uses `#FF4326` in app.json so the OS
          handoff stays seamless. */}
      <LaunchSplash />
      {/* Default animation is slide_from_right (Apple-standard
          drill-down). Per-screen overrides below opt routes
          into other animations (none / fade / slide_from_bottom)
          where the semantics differ.

          Previously the default was "fade", which is a crossfade
          — by definition both screens are visible simultaneously
          during the animation. That read as a "previous page
          briefly overlapping the new one" ghost frame during
          every push, especially noticeable on index → onboarding
          where the warm amber radial from the landing bled into
          the first onboarding screen for ~200ms.

          Slide gives a clean horizontal hand-off where the new
          screen covers the old one as it moves into place. The
          opaque contentStyle below ensures no see-through. */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "slide_from_right",
        }}
      >
        {/* (tabs) is the main app. We arrive here in two ways:
            1) router.replace("/today") from the landing or after
               onboarding completes, and
            2) cold start when onboarding.completed is true (the
               landing screen redirects us here).
            Both are "arriving home", not "drilling forward", so
            we override the default slide with a fade — the home
            tab paints up softly instead of sliding in from the
            side. */}
        <Stack.Screen
          name="(tabs)"
          options={{ animation: "fade" }}
        />
        {/* Onboarding group — explicit drill-in from the landing.
            Inherits the default slide_from_right, but called out
            here for clarity. */}
        <Stack.Screen
          name="onboarding"
          options={{ animation: "slide_from_right" }}
        />
        {/* Profile used to live here as a transparentModal drawer
            launched from the home avatar. It was promoted to a
            first-class TAB (see app/(tabs)/profile.tsx) when the
            tab bar was consolidated to Home / Library / Profile,
            so there's no longer a top-level profile route to
            register — the avatar tap on home now switches the
            active tab instead of presenting a modal. */}
        {/* Settings + book groups push from the right (Apple
            drill-down). Each has its own inner Stack layout
            inheriting this. */}
        <Stack.Screen
          name="settings"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="book"
          options={{
            animation: "slide_from_right",
          }}
        />
        {/* Top-level personal-scripture screens — drill-down
            semantics like settings, since they're typically
            entered from the drawer or Insights. */}
        <Stack.Screen
          name="notes"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="highlights"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="completed-sermons"
          options={{
            animation: "slide_from_right",
            headerShown: false,
          }}
        />
        {/* Per-check-in detail page (app/check-ins/[id].tsx).
            Drill-down semantics matching notes / highlights —
            reached from the Journey timeline. */}
        <Stack.Screen
          name="check-ins/[id]"
          options={{ animation: "slide_from_right" }}
        />
        {/* Insight (magazine article) detail. Drill-down
            from the Insights index. */}
        <Stack.Screen
          name="insight/[id]"
          options={{ animation: "slide_from_right" }}
        />
        {/* "Your Practice" stats screen — the data view that
            used to live on the Insights tab, now reached
            from the Profile drawer so the tab can host the
            content library instead. */}
        <Stack.Screen
          name="stats"
          options={{ animation: "slide_from_right" }}
        />
        {/* Reading-goal detail (Apple-Fitness-style ring
            drill-in). Tap the home ring → big ring, hourly
            chart, weekly mini-rings; "Edit goal" drills
            one level deeper into settings/reading-goal. */}
        <Stack.Screen
          name="reading-goal"
          options={{ animation: "slide_from_right" }}
        />
        {/* Rhythm detail (HabitKit-style). Tap the
            current-month grid on home → full-year heatmap,
            monthly chart, streak stats. Presented as a
            modal so the close affordance is an X (no
            back chevron) and the screen reads as a stats
            canvas rather than a drill-down. */}
        <Stack.Screen
          name="rhythm"
          options={{
            // Full-screen so the native Liquid Glass tab bar underneath
            // doesn't peek through or re-layout during the slide-up.
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="milestone/[day]"
          options={{ animation: "slide_from_right" }}
        />
        {/* Mood check-in. Presented as a full-screen modal
            (slide from bottom) so the user feels like
            they're entering a quiet, separate moment. Has
            its own inner Stack for mood-select → verse. */}
        <Stack.Screen
          name="check-in"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        {/* Bible study landing page (app/study/[id].tsx) —
            the deep-link target for a scheduled study-session
            notification tap. Presented as a full-screen
            slide-from-bottom modal so it lands as a
            "stepping into a quiet moment" beat rather than
            a stack-drilldown. The screen owns its own
            "close" affordance that replaces to /(tabs)/today. */}
        <Stack.Screen
          name="study/[id]"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        {/* Sermon flow — fade from home so the shared Unsplash
            backdrop reads as one continuous photograph while
            copy dissolves into the scripture quote. */}
        <Stack.Screen
          name="sermon"
          options={{
            animation: "fade",
            animationDuration: 650,
            contentStyle: { backgroundColor: "#0A0A0A" },
          }}
        />
      </Stack>
    </>
  );
}

/**
 * Holds the splash screen up until every persistence-backed provider
 * has loaded from disk. Without this gate the app would paint once
 * with default state (no streak, no preferences, no annotations),
 * then re-paint a moment later when AsyncStorage resolves — a
 * visible flicker that's especially harsh on a dark UI.
 *
 * Hydration is fast (single-digit milliseconds for typical payloads)
 * so the user just sees the splash screen for an imperceptibly
 * longer instant. The cost is small; the benefit is the first
 * frame the user sees is THEIR app, not a default shell.
 */
function HydrationGate({ children }: { children: React.ReactNode }) {
  const { hydrated: authHydrated } = useAuth();
  const { hydrated: onboardingHydrated } = useOnboarding();
  const { hydrated: preferencesHydrated } = usePreferences();
  const { hydrated: progressHydrated } = useProgress();
  const { hydrated: annotationsHydrated } = useAnnotations();
  const { hydrated: checkInsHydrated } = useCheckIns();
  const { hydrated: momentsHydrated } = useMoments();
  const { hydrated: readingGoalHydrated } = useReadingGoal();
  const { hydrated: savedInsightsHydrated } = useSavedInsights();
  const { hydrated: themeHydrated } = useTheme();
  const { hydrated: focusHydrated } = useFocus();
  const { hydrated: studySessionsHydrated } = useStudySessions();
  const { hydrated: devToolsHydrated } = useDevTools();

  const allReady =
    authHydrated &&
    onboardingHydrated &&
    preferencesHydrated &&
    progressHydrated &&
    annotationsHydrated &&
    checkInsHydrated &&
    momentsHydrated &&
    readingGoalHydrated &&
    savedInsightsHydrated &&
    themeHydrated &&
    focusHydrated &&
    studySessionsHydrated &&
    devToolsHydrated;

  useEffect(() => {
    if (allReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [allReady]);

  if (!allReady) return null;
  return <>{children}</>;
}

/**
 * Empty render-tree component whose only job is to invoke
 * `useNotificationDeepLink` from a place that's GUARANTEED to be
 * inside the navigation context AND past the hydration gate.
 *
 * It returns null so it adds nothing visible to the screen — it's
 * purely a lifecycle anchor for the deep-link hook.
 */
function NotificationDeepLinkHandler(): null {
  useNotificationDeepLink();
  return null;
}
