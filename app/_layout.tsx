import "../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { colors } from "@/constants/theme";
import { AnnotationsProvider, useAnnotations } from "@/state/annotations";
import { CheckInsProvider, useCheckIns } from "@/state/checkIns";
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

SplashScreen.preventAutoHideAsync().catch(() => {
  /* splash screen may already be hidden; safe to ignore */
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <OnboardingProvider>
        <PreferencesProvider>
          <AnnotationsProvider>
            <ProgressProvider>
              <CheckInsProvider>
                <ReadingGoalProvider>
                <SavedInsightsProvider>
                <HydrationGate>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.bg },
                    animation: "fade",
                  }}
                >
                  {/* Profile renders as a left-side drawer (NOT a bottom
                      sheet). transparentModal keeps the home screen
                      visible behind it; animation: "none" lets the
                      drawer's own Animated.spring drive the slide-in. */}
                  <Stack.Screen
                    name="profile"
                    options={{
                      presentation: "transparentModal",
                      animation: "none",
                      gestureEnabled: false,
                    }}
                  />
                  {/* Settings + book groups push from the right (Apple
                      drill-down). Each has its own inner Stack layout
                      inheriting this. */}
                  <Stack.Screen
                    name="settings"
                    options={{ animation: "slide_from_right" }}
                  />
                  <Stack.Screen
                    name="book"
                    options={{ animation: "slide_from_right" }}
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
                </Stack>
                </HydrationGate>
                </SavedInsightsProvider>
                </ReadingGoalProvider>
              </CheckInsProvider>
            </ProgressProvider>
          </AnnotationsProvider>
        </PreferencesProvider>
      </OnboardingProvider>
    </GestureHandlerRootView>
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
  const { hydrated: onboardingHydrated } = useOnboarding();
  const { hydrated: preferencesHydrated } = usePreferences();
  const { hydrated: progressHydrated } = useProgress();
  const { hydrated: annotationsHydrated } = useAnnotations();
  const { hydrated: checkInsHydrated } = useCheckIns();
  const { hydrated: readingGoalHydrated } = useReadingGoal();
  const { hydrated: savedInsightsHydrated } = useSavedInsights();

  const allReady =
    onboardingHydrated &&
    preferencesHydrated &&
    progressHydrated &&
    annotationsHydrated &&
    checkInsHydrated &&
    readingGoalHydrated &&
    savedInsightsHydrated;

  useEffect(() => {
    if (allReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [allReady]);

  if (!allReady) return null;
  return <>{children}</>;
}
