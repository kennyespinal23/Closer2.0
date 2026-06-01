import { useCallback, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useSegments } from "expo-router";
import Svg, { Path } from "react-native-svg";
import {
  isShieldSupported,
  summarizeBlockedApps,
} from "@/lib/focus";
import { useFocus } from "@/state/focus";
import { useColors } from "@/state/theme";

/**
 * Global floating focus banner.
 *
 * Mounted at each layout that wants the banner (the tabs layout,
 * the settings layout, the book layout). Each mount renders the
 * banner above its own navigator's content so the user has
 * consistent "you're in a focus session" chrome regardless of
 * which surface they're on.
 *
 * Why per-layout instead of a single root mount? We tried two
 * "single mount" patterns and both failed:
 *   1. Sibling to the root <Stack>: the banner rendered cleanly
 *      in the React tree but iOS native-stack screens
 *      (react-native-screens-backed) sit at the UIView level
 *      above sibling React-tree overlays, so the banner was
 *      invisible on every screen the navigator owned.
 *   2. RN <Modal> at the root: the banner became visible but the
 *      Modal interfered with tab-bar touch handling — tapping
 *      Journey from Today caused the app to freeze with the new
 *      tab's content rendered but no interaction allowed.
 * Per-layout mounting sidesteps both: each mount is a sibling to
 * the navigator INSIDE the layout's screen container, so iOS
 * stacking + touch handling both behave normally, and we get the
 * full session-active coverage by mounting in every navigator
 * that wraps user-facing routes.
 *
 * Where this lives in the system:
 *
 *   1. /sermon/* screens use the INLINE <FocusBanner /> (same
 *      visual language, but positioned in-flow just under the
 *      sermon header so it's clearly part of the sermon chrome).
 *      The global banner self-suppresses inside sermon routes.
 *   2. /today (the home tab) uses the inline <FocusToggle /> pill
 *      — that's a full controller (Switch + drill-down), so the
 *      global banner self-suppresses on Today to avoid two
 *      indicators stacked vertically.
 *   3. Onboarding and the check-in modal self-suppress because
 *      they're deliberate, time-boxed moments that shouldn't
 *      carry cross-feature chrome.
 *   4. Everything else — book reader, settings, Journey / Library
 *      / Insights tabs — gets the floating banner via its layout
 *      mount.
 *
 * Behavior:
 *   • Renders nothing when no session is active — safe to mount
 *     unconditionally
 *   • Tap body  → router.push("/settings/focus") so the user can
 *     manage the app list or end the session from inside the
 *     dedicated screen
 *   • Tap End   → Alert.alert confirm before tearing down (matches
 *     the in-sermon banner pattern — the commitment shouldn't be
 *     a one-tap dismiss)
 *
 * Positioning:
 *   • Absolute, anchored to the top safe-area inset + a small
 *     breath gap. The mount layout owns its own screen container,
 *     so absolute-positioning inside that container correctly
 *     overlays whatever screen is currently active.
 *   • Drop shadow on iOS / elevation on Android so it reads as
 *     "above the canvas" rather than "stuck to the wall".
 *   • `pointerEvents="box-none"` on the wrapper so taps that miss
 *     the banner's pill pass through to whatever the underlying
 *     screen is rendering.
 */

/** Same iOS-system-blue used by FocusBanner + FocusToggle + the
 *  reading-goal ring. Re-declared (not imported) so this file
 *  stays a standalone unit you can lift into a different layout
 *  without dragging in another module's constants. */
const FOCUS_ACCENT = "#0A84FF";

/**
 * The vertical space the banner occupies (in points) when it's
 * visible — i.e. the height that layouts should reserve at the
 * top of their content so the absolute-positioned banner doesn't
 * overlap whatever the screen is rendering.
 *
 * Composition (matches the actual <Pressable> below):
 *   • top offset from the safe area:  6   (insets.top + 6 in the
 *                                          banner's own style)
 *   • pill internal padding:         10 + 10 (py-2.5 ≈ 10pt each)
 *   • pill text content:             ~28  (eyebrow + sublabel,
 *                                          two ~12pt lines with
 *                                          inter-line spacing)
 *   • bottom breath gap:              6
 *   • TOTAL:                        ≈ 60
 *
 * Layouts add this (via `useGlobalFocusBannerSpacing()`) to the
 * paddingTop of the container that wraps their navigator. The
 * banner itself stays absolutely positioned so it floats above
 * the layout without affecting flex flow — the spacing here is
 * just the empty top gutter that keeps screen content from being
 * occluded.
 */
const GLOBAL_FOCUS_BANNER_SPACING = 60;

/**
 * Hook used by layouts that host the banner to compute how much
 * top padding their navigator container needs RIGHT NOW. Returns
 * 0 when:
 *   • there's no active focus session, OR
 *   • the current route is in the banner's hide list
 *     (sermon / onboarding / start / today / check-in).
 *
 * Returns `GLOBAL_FOCUS_BANNER_SPACING` otherwise. Using a hook
 * here (rather than the layout re-implementing the same checks)
 * keeps the "when does the banner show?" rule in exactly one
 * place — change the predicate in shouldHideForSegments and every
 * layout's padding updates automatically.
 */
export function useGlobalFocusBannerSpacing(): number {
  const { session } = useFocus();
  const segments = useSegments();
  if (!session) return 0;
  if (shouldHideForSegments(segments)) return 0;
  return GLOBAL_FOCUS_BANNER_SPACING;
}

export function GlobalFocusBanner() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const { session, endSession } = useFocus();
  const [ending, setEnding] = useState(false);

  // Suppression check is colocated with the banner itself so any
  // consumer that mounts it (root layout today, hypothetically a
  // different layer tomorrow) gets the same exclusion rules
  // without needing to remember to wire them up. Inline rather
  // than via a separate helper because the predicate only has one
  // caller and the rules read cleanly as a flat switch.
  const hidden = shouldHideForSegments(segments);

  const handleEnd = useCallback(() => {
    if (ending) return;
    Alert.alert(
      "End focus session?",
      isShieldSupported()
        ? "Apps will be unblocked right away. You can start another session anytime."
        : "Your focus commitment will end. You can start another one anytime.",
      [
        { text: "Keep focusing", style: "cancel" },
        {
          text: "End session",
          style: "destructive",
          onPress: async () => {
            setEnding(true);
            try {
              await endSession();
            } finally {
              setEnding(false);
            }
          },
        },
      ],
    );
  }, [ending, endSession]);

  const handleOpen = useCallback(() => {
    router.push("/settings/focus");
  }, [router]);

  // Conditional render AFTER all hooks above — keeps hook order
  // stable across renders regardless of session/route state.
  if (!session || hidden) return null;

  const subtitle = summarizeBlockedApps(session.blockedAppIds);

  return (
    // box-none lets taps NOT on the pill fall through to the
    // screen content below. The outer wrapper is purely a
    // positioning layer, not a touch interceptor.
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: insets.top + 6,
        left: 0,
        right: 0,
        alignItems: "stretch",
        // High z-index so we sit cleanly above whatever the
        // current screen is rendering. We don't try to compete
        // with native modals (the profile drawer, the check-in
        // modal) — the per-layout mounting strategy means we
        // only ever try to draw in layouts where this overlay
        // belongs, and the hide-rules suppress us in the rest.
        zIndex: 50,
      }}
    >
      <Pressable
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel="Focus mode active. Tap to open settings."
        className="mx-4 rounded-2xl flex-row items-center px-3.5 py-2.5"
        style={({ pressed }) => ({
          backgroundColor: withAlpha(FOCUS_ACCENT, 0.96),
          opacity: pressed ? 0.95 : 1,
          // Drop shadow — keeps the floating banner visually lifted
          // off whatever surface is behind it (works for both
          // dark and light themes since it's a pure black blur).
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        })}
      >
        {/* Live dot on a slightly lighter wash so it reads as
            "filament inside the lamp" rather than a flat label
            color matching the background. */}
        <View
          className="w-2 h-2 rounded-full mr-3"
          style={{ backgroundColor: "#FFFFFF" }}
        />

        <View className="flex-1 pr-2">
          <Text
            className="text-[11.5px] tracking-[1.6px] uppercase"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: "#FFFFFF",
            }}
          >
            Focus mode active
          </Text>
          <Text
            className="text-[11.5px] mt-0.5"
            style={{
              fontFamily: "PlusJakartaSans_500Medium",
              // A softened white for the secondary line so the
              // hierarchy still reads (eyebrow > sublabel) on the
              // solid-color background.
              color: "rgba(255,255,255,0.82)",
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>

        {/* End pill — sits inside the banner instead of being a
            sibling so the Pressable on the body still feels like
            a contained card. We stop event propagation manually
            in the onPress so the body's handler doesn't ALSO
            fire on End taps. */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            handleEnd();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="End focus session"
          className="rounded-full px-3 py-1.5"
          style={({ pressed }) => ({
            backgroundColor: "rgba(255,255,255,0.18)",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            className="text-[11.5px] tracking-[0.5px]"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: "#FFFFFF",
            }}
          >
            End
          </Text>
        </Pressable>

        {/* Trailing micro-chevron hinting "tap me for more". Sits
            after the End pill so the visual reading order is
            still: status → action → drill-down hint. The
            chevron stays subtle (45% alpha) since it's a hint,
            not an affordance to compete with End. */}
        <View className="ml-2">
          <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 6l6 6-6 6"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </Pressable>
    </View>
  );
}

/**
 * Compose an alpha into a `#RRGGBB` hex string, returning a CSS
 * `rgba(r, g, b, a)` string usable by RN's color props. Same helper
 * as the other focus components — could be lifted into a shared
 * lib/color.ts once a fourth copy appears.
 */
function withAlpha(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return hex;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Decide whether the global banner should suppress itself on the
 * current route. Takes the raw `useSegments()` output and folds it
 * into the exclusion rules below.
 *
 * IMPORTANT: expo-router populates `segments` from the *qualified*
 * navigation path, which **preserves group route names** like
 * `(tabs)`. So:
 *
 *   /today        (lives in app/(tabs)/today.tsx)
 *      → segments = ["(tabs)", "today"]
 *      → pathname = "/today"        // groups stripped here, but
 *                                   //  NOT in segments
 *
 * (The pathname-vs-segments asymmetry is intentional in expo-router
 *  3.x — pathname is the "user-facing" URL, segments is the
 *  navigation-tree position. Easy to get wrong because the field
 *  names sound similar.)
 *
 * Examples of how expo-router populates `segments`:
 *
 *   /                       → []
 *   /today                  → ["(tabs)", "today"]
 *   /journey                → ["(tabs)", "journey"]
 *   /library                → ["(tabs)", "library"]
 *   /insights               → ["(tabs)", "insights"]
 *   /sermon/intro           → ["sermon", "intro"]
 *   /sermon/panel/3         → ["sermon", "panel", "[id]"]
 *   /check-in               → ["check-in"]
 *   /check-in/anxious       → ["check-in", "[mood]"]
 *   /onboarding/focus       → ["onboarding", "focus"]
 *   /book/john/3            → ["book", "[id]", "[chapter]"]
 *   /settings/focus         → ["settings", "focus"]
 *   /profile                → ["profile"]
 *
 * Hidden categories:
 *   • Root landing (`/start` or empty) — pre-app surface; banner
 *     has no useful context.
 *   • Onboarding — deliberate setup flow; cross-feature chrome
 *     would be noisy.
 *   • Sermon flow — has its own inline FocusBanner under the
 *     header; stacking the global banner on top would double up.
 *   • Today tab — has the rich inline FocusToggle pill that
 *     already surfaces session state with controls.
 *   • Check-in modal — brief sacred moment; we don't pile on
 *     chrome.
 */
function shouldHideForSegments(segments: string[]): boolean {
  // Empty segments == root landing screen. No banner there.
  if (segments.length === 0) return true;

  const root = segments[0];

  // Sermon flow has its own inline banner.
  if (root === "sermon") return true;

  // Onboarding is its own world.
  if (root === "onboarding") return true;

  // Start (pre-launch landing).
  if (root === "start") return true;

  // Mood check-in modal — brief, focused moment.
  if (root === "check-in") return true;

  // Study-session landing — same logic as sermon intro: the user
  // landed here to start a session, so showing a "session active"
  // banner across the top would be incoherent (you're about to
  // start one). The landing screen has its own inline cue.
  if (root === "study") return true;

  // Today tab lives inside the (tabs) group, so the segments
  // array is ["(tabs)", "today"]. Check both positions defensively
  // in case expo-router's segments shape changes again in a future
  // version — we'd rather over-hide on Today than ever stack two
  // focus indicators on top of each other.
  if (root === "today") return true;
  if (root === "(tabs)" && segments[1] === "today") return true;

  return false;
}
