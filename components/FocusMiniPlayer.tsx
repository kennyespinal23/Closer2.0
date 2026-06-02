import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, Platform, Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useSegments } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { isShieldSupported, summarizeBlockedApps } from "@/lib/focus";
import { useFocus } from "@/state/focus";
import { useStudySessions } from "@/state/studySessions";
import { useColors, useResolvedScheme } from "@/state/theme";

/**
 * FocusMiniPlayer
 *
 * Persistent bottom strip that floats above the GlassTabBar while
 * a focus session is active — modeled on Opal's "Now Playing"
 * pattern. Hidden entirely when no session is on, so it doesn't
 * compete for space during normal browsing.
 *
 * Anatomy:
 *
 *   ┌─────────────────────────────────────────────────┐
 *   │ ● Work Time            12:34                End │   ← floating pill
 *   └─────────────────────────────────────────────────┘
 *   ┌─────────────────────────────────────────────────┐
 *   │  Today   Practice   +   Library   Insights      │   ← GlassTabBar
 *   └─────────────────────────────────────────────────┘
 *
 * Visual language:
 *   • Same horizontal inset (16pt) and pill shape as GlassTabBar so
 *     the two read as a stacked pair, not two unrelated chips.
 *   • BlurView + themed backing matches the tab bar's frosted-glass
 *     treatment — keeps the pair coherent on colorful scroll
 *     content (book covers, gradient hero images).
 *   • Single accent dot (iOS-system-blue) for the "session active"
 *     state — same color as the FocusBanner and FocusToggle so
 *     focus is a recognizable color anchor across surfaces.
 *
 * Why a mini-player and not the old top banner?
 *   The previous GlobalFocusBanner floated at the top of every tab
 *   and pushed real content down 60pt across the board — a high
 *   cost for what's secondary chrome. A bottom mini-player:
 *     - sits next to the tab bar so it feels like nav chrome (not
 *       a header) and the user reads it as a "now playing" strip
 *     - leaves the top of every screen unconstrained, so hero
 *       imagery, page titles, and section labels all start at the
 *       safe-area inset like they did before focus existed
 *     - is dismissible-feeling without actually being dismissable
 *       (no close X) — the End button is the only exit path,
 *       which preserves the original banner's "don't accidentally
 *       drop the shield" intent
 *
 * Interaction model:
 *   • Body tap   → /settings/focus (manage apps / end from inside
 *                  the dedicated screen)
 *   • End tap    → Alert.alert confirm before tearing down (mirrors
 *                  GlobalFocusBanner — the commitment shouldn't be
 *                  a one-tap dismiss)
 *
 * Suppression rules (same intent as the old GlobalFocusBanner):
 *   • Onboarding              — deliberate setup flow
 *   • Sermon /sermon/*        — has its own inline FocusBanner
 *   • Study /study/*          — landing screen for starting a session
 *   • Check-in modal          — brief sacred moment
 *   • Root pre-launch /start  — no app shell yet
 *
 * Note: unlike the old banner, this DOES render on Today. The home
 * tab's inline FocusToggle is a controller (manage on/off), while
 * the mini-player is a live status + end-control. They serve
 * different roles so a small amount of redundancy is intentional.
 */

/** iOS-system-blue. Same constant as FocusBanner / FocusToggle /
 *  GlobalFocusBanner. Re-declared (not imported) so this file is
 *  a self-contained unit you can lift into a different layout
 *  without dragging in another module's constants. */
const FOCUS_ACCENT = "#0A84FF";

/** The height the mini-player occupies (pill content + internal
 *  padding). Exported via the spacing hook below so layouts can
 *  reserve enough bottom padding in their scroll content to keep
 *  the last item from being permanently occluded by the pill. */
const PILL_HEIGHT = 56;

/** Gap between the mini-player pill and whatever sits below it
 *  (the GlassTabBar pill on tabbed screens, the safe-area inset
 *  on stack screens). Small enough that the pair reads as one
 *  stacked component, large enough that the two pills don't
 *  visually touch. */
const PILL_GAP = 8;

/** Approximate GlassTabBar pill height (mirrors the value in
 *  components/GlassTabBar.tsx). Kept as a local constant rather
 *  than imported so a future tab-bar swap doesn't silently break
 *  the mini-player's vertical anchoring. */
const TAB_BAR_PILL_HEIGHT = 62;

export type FocusMiniPlayerProps = {
  /**
   * Whether the mini-player should leave room for a GlassTabBar
   * underneath it. Default `true` — appropriate for any layout
   * whose screens render inside the (tabs) navigator. Stack
   * layouts that push OVER the tabs (book reader, settings, etc.)
   * pass `false` so the pill anchors just above the safe-area
   * inset instead of floating into empty space.
   */
  aboveTabBar?: boolean;
};

/**
 * Total vertical space the mini-player + its gap occupy above the
 * tab bar, in points. Use this hook from any tab screen whose
 * scroll content's last item would otherwise be hidden under the
 * pill. Returns 0 when the session is inactive or the pill is
 * suppressed on the current route — so on routes where the
 * mini-player isn't visible, no extra bottom padding is reserved.
 */
export function useFocusMiniPlayerSpacing(): number {
  const { session } = useFocus();
  const segments = useSegments();
  if (!session) return 0;
  if (shouldHideForSegments(segments)) return 0;
  return PILL_HEIGHT + PILL_GAP;
}

export function FocusMiniPlayer({ aboveTabBar = true }: FocusMiniPlayerProps = {}) {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const scheme = useResolvedScheme();
  const isDark = scheme === "dark";
  const { session, endSession, pauseSession, resumeSession } = useFocus();
  const { sessions: studySessions } = useStudySessions();
  const [ending, setEnding] = useState(false);

  // Live elapsed time. Ticks once per second from a setInterval so
  // the number updates without us having to push state on every
  // render of the surrounding tree. Cleared whenever the session
  // goes away so we don't keep firing after teardown.
  //
  // Also paused: we keep ticking even when the session is paused
  // so the (frozen) timer label STILL reflects "the moment the
  // user paused" — without the tick the label would freeze at
  // whatever value the JS thread last computed, which can drift
  // a few hundred ms behind the pause action.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  // Soft pulse on the live-dot — a barely-visible breathing animation
  // that signals "this is live, not a stale frame." Restarts on every
  // session change so closing + reopening a session resets the rhythm
  // cleanly. Native-driven so it never competes with JS for frames.
  //
  // When the session is PAUSED we stop the loop and leave the halo
  // dim — the dot itself stays opaque but the breathing motion is
  // exactly what communicates "live", so freezing it is the
  // strongest visual cue we have that the session is on hold.
  const pulse = useRef(new Animated.Value(0)).current;
  const isPaused = Boolean(session?.pausedAt);
  useEffect(() => {
    if (!session || isPaused) return;
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [session, pulse, isPaused]);

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
    // Route to the Blocks screen (the redesigned Practice tab) when
    // the user taps the pill body. Falls back to /settings/focus on
    // older builds where the Blocks screen doesn't exist yet.
    router.push("/journey");
  }, [router]);

  const handleTogglePause = useCallback(() => {
    if (!session) return;
    // Idempotent on both sides — pauseSession is a no-op when
    // already paused, resumeSession is a no-op when not paused.
    // Reading from session.pausedAt at click time keeps the
    // dispatch correct even if the user spam-taps the button
    // faster than the state update can re-render the icon.
    if (session.pausedAt) {
      resumeSession();
    } else {
      pauseSession();
    }
  }, [session, pauseSession, resumeSession]);

  if (!session || hidden) return null;

  // Resolve a display name for the strip. Priority:
  //   1. The originating study session's name (e.g. "Morning Study")
  //   2. A generic "Focus Mode" fallback when the session was
  //      started directly from the home toggle or sermon flow with
  //      no routine attached.
  const routineName =
    session.routineId
      ? studySessions.find((s) => s.id === session.routineId)?.name
      : undefined;
  const title = routineName ?? "Focus Mode";
  const subtitle = summarizeBlockedApps(session.blockedAppIds);

  // Effective elapsed math:
  //   raw  = now - startedAt                 (wall-clock age)
  //   eff  = raw - accumulatedPausedMs       (minus prior pauses)
  //          - (paused ? now - pausedAt : 0) (minus current pause)
  // This is the same formula used by ActiveFocusCard and the
  // stale-session sweeper — kept in sync by being short enough to
  // not warrant extracting a shared util.
  const accumPaused = session.accumulatedPausedMs ?? 0;
  const openPause = session.pausedAt ? Math.max(0, now - session.pausedAt) : 0;
  const elapsedMs = Math.max(0, now - session.startedAt - accumPaused - openPause);

  // Display mode:
  //   • durationMs set  → countdown (max(0, duration - elapsed))
  //   • durationMs unset → elapsed counter (legacy / sermon mode)
  // The label under the time string changes too ("LEFT" vs
  // "ELAPSED") so the user reads the number correctly at a glance.
  const hasDuration =
    typeof session.durationMs === "number" && session.durationMs > 0;
  const remainingMs = hasDuration
    ? Math.max(0, (session.durationMs ?? 0) - elapsedMs)
    : 0;
  const timeLabel = hasDuration
    ? formatElapsed(remainingMs)
    : formatElapsed(elapsedMs);
  const timeMetaLabel = hasDuration ? "Left" : "Elapsed";

  // Theme-aware glass. Mirrors GlassTabBar's treatment so the two
  // pills read as a stacked pair under all backgrounds. The
  // backing is rendered UNDER the BlurView so colorful scroll
  // content can't bleed through and murk up the pill — same
  // tactic used in the tab bar for the same reason.
  const pillBorderColor = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(15, 15, 15, 0.10)";
  const backingColor = isDark
    ? "rgba(12, 12, 14, 0.78)"
    : "rgba(255, 255, 255, 0.82)";
  const androidFill = isDark
    ? "rgba(20, 20, 20, 0.96)"
    : "rgba(255, 255, 255, 0.96)";
  const endBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,15,15,0.06)";
  const endLabelColor = isDark ? "#FFFFFF" : "#0F0F10";

  // Vertical anchor:
  //   • Tabbed layouts — the GlassTabBar sits at
  //     `insets.bottom + TAB_BAR_PILL_HEIGHT` from the bottom; the
  //     mini-player floats `PILL_GAP` above that.
  //   • Stack layouts (book reader, settings) — there's no tab bar
  //     under us, so we anchor `PILL_GAP` above the safe-area inset
  //     directly. Phones with home-bars and phones with home buttons
  //     both get the same visual breath.
  const bottomOffset = aboveTabBar
    ? insets.bottom + TAB_BAR_PILL_HEIGHT + PILL_GAP
    : insets.bottom + PILL_GAP;

  return (
    <View
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: bottomOffset,
        alignItems: "stretch",
        // Sits above the tab bar in stacking order. Tab bar uses
        // its own z so we just need to beat the screen content.
        zIndex: 40,
      }}
    >
      <Pressable
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel={`Focus mode active. ${title}. ${timeLabel} ${timeMetaLabel.toLowerCase()}.${isPaused ? " Paused." : ""} Tap to manage.`}
        style={({ pressed }) => ({
          marginHorizontal: 16,
          height: PILL_HEIGHT,
          borderRadius: 22,
          overflow: "hidden",
          opacity: pressed ? 0.92 : 1,
          // Shadow lifts the pill off the screen contents behind it
          // so it reads as floating chrome rather than embedded
          // content. Black blur works for both themes.
          shadowColor: "#000",
          shadowOpacity: 0.22,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        })}
      >
        {/* Themed backing — opaque enough that brand colors behind
            don't show through and tint the pill. The BlurView
            sits on top for the subtle frosted texture. */}
        <View
          style={{
            ...absoluteFill,
            backgroundColor:
              Platform.OS === "android" ? androidFill : backingColor,
          }}
        />
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={28}
            tint={isDark ? "dark" : "light"}
            style={absoluteFill}
          />
        ) : null}
        {/* Border — drawn as an absolutely-positioned overlay rather
            than as a borderColor on the Pressable so the inner
            content padding isn't affected by border width. */}
        <View
          pointerEvents="none"
          style={{
            ...absoluteFill,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: pillBorderColor,
          }}
        />

        <View className="flex-row items-center pl-3 pr-2 h-full">
          {/* Live dot — accent fill with a soft halo that breathes.
              The halo (sized larger than the dot, lower opacity) is
              what gives the dot its "alive" feel without the dot
              itself flashing distractingly. */}
          <View
            style={{
              width: 22,
              height: 22,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: FOCUS_ACCENT,
                opacity: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.16, 0.34],
                }),
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.75, 1],
                    }),
                  },
                ],
              }}
            />
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: FOCUS_ACCENT,
              }}
            />
          </View>

          <View className="flex-1 pr-2">
            <Text
              numberOfLines={1}
              className="text-[13.5px]"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: colors.ink,
                letterSpacing: 0.1,
              }}
            >
              {title}
            </Text>
            <Text
              numberOfLines={1}
              className="text-[11px] mt-0.5"
              style={{
                fontFamily: "PlusJakartaSans_500Medium",
                color: colors.inkMuted,
              }}
            >
              {subtitle}
            </Text>
          </View>

          {/* Tabular-spaced time so the digits don't jiggle as they
              tick (1:09 → 1:10 wouldn't shift width). Dims slightly
              while paused so the user sees the frozen-timer state
              even before they read the LEFT/ELAPSED label. */}
          <View
            className="pr-2 pl-1 items-end"
            style={{ opacity: isPaused ? 0.55 : 1 }}
          >
            <Text
              className="text-[13px]"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: colors.ink,
                fontVariant: ["tabular-nums"],
                letterSpacing: 0.2,
              }}
            >
              {timeLabel}
            </Text>
            <Text
              className="text-[9.5px] tracking-[1px] uppercase"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: colors.inkSubtle,
                marginTop: 1,
              }}
            >
              {timeMetaLabel}
            </Text>
          </View>

          {/* Pause / Resume — icon-only round button. Only rendered
              for time-boxed sessions (hasDuration). Open-ended
              sessions skip pause since "pausing an elapsed counter
              that has no target" has no clear meaning. The icon
              swaps based on session.pausedAt. Wrapping View+Pressable
              keeps event bubbling contained to the body's onOpen. */}
          {hasDuration ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                handleTogglePause();
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={
                isPaused ? "Resume focus session" : "Pause focus session"
              }
              style={({ pressed }) => ({
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: endBg,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 6,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              {isPaused ? (
                // Play triangle — single Path so the geometry stays
                // crisp at 11pt. Slight rightward x offset (1.2)
                // optically centers the triangle in the round
                // button since the visual mass leans left.
                <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                  <Path d="M6 4l14 8-14 8V4z" fill={endLabelColor} />
                </Svg>
              ) : (
                // Pause icon — two rounded bars. Rendered as two
                // narrow Paths so we get the rounded ends without
                // needing an Rx attribute (which SVG paths support
                // but is finicky to compute by hand for tiny bars).
                <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                  <Path d="M6 4h4v16H6z" fill={endLabelColor} />
                  <Path d="M14 4h4v16h-4z" fill={endLabelColor} />
                </Svg>
              )}
            </Pressable>
          ) : null}

          {/* End pill — wrapped in a View+Pressable so the inner
              Pressable's onPress stops bubbling to the body. Same
              event-isolation tactic as GlobalFocusBanner's End. */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              handleEnd();
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="End focus session"
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 14,
              backgroundColor: endBg,
              opacity: pressed ? 0.6 : 1,
              flexDirection: "row",
              alignItems: "center",
            })}
          >
            <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
              <Path
                d="M6 6h12v12H6z"
                fill={endLabelColor}
              />
            </Svg>
            <Text
              className="text-[11.5px]"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: endLabelColor,
                marginLeft: 5,
                letterSpacing: 0.2,
              }}
            >
              End
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** Inline absolute-fill style. Avoids importing StyleSheet just for
 *  the four-property convenience. */
const absoluteFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

/**
 * Format an elapsed duration as either "M:SS" (under an hour) or
 * "H:MM:SS" (over an hour). Mirrors Opal's bottom-strip format.
 * Pads minutes & seconds so the field width stays stable.
 */
function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) {
    const mm = String(minutes).padStart(2, "0");
    return `${hours}:${mm}:${ss}`;
  }
  return `${minutes}:${ss}`;
}

/**
 * Suppression rules for the mini-player.
 *
 * Mirrors the old GlobalFocusBanner's exclusion list with one
 * intentional exception: the Today tab is NO LONGER hidden. Today
 * keeps its inline FocusToggle pill (which is a controller), and
 * we now show the mini-player there too as the live "now playing"
 * status. The two serve distinct roles (controller vs status) so
 * the small amount of redundancy is intentional.
 *
 * Examples of how expo-router populates `segments`:
 *
 *   /                       → []
 *   /today                  → ["(tabs)", "today"]
 *   /journey                → ["(tabs)", "journey"]
 *   /library                → ["(tabs)", "library"]
 *   /insights               → ["(tabs)", "insights"]
 *   /sermon/intro           → ["sermon", "intro"]
 *   /check-in               → ["check-in"]
 *   /onboarding/anything    → ["onboarding", "anything"]
 *   /book/john/3            → ["book", "[id]", "[chapter]"]
 *   /settings/focus         → ["settings", "focus"]
 *   /study/<id>             → ["study", "[id]"]
 *   /profile                → ["profile"]
 */
function shouldHideForSegments(segments: string[]): boolean {
  if (segments.length === 0) return true;
  const root = segments[0];
  if (root === "sermon") return true;
  if (root === "onboarding") return true;
  if (root === "start") return true;
  if (root === "check-in") return true;
  if (root === "study") return true;
  return false;
}
