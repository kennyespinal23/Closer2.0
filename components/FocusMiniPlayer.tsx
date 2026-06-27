import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, Platform, Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useSegments } from "expo-router";
import { SFSymbol } from "@/components/Symbol";
import { isShieldSupported } from "@/lib/focus";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useFocus } from "@/state/focus";
import { useMoments } from "@/state/moments";
import { didCompleteToday, useProgress } from "@/state/progress";
import { useColors, useResolvedScheme } from "@/state/theme";

/**
 * FocusMiniPlayer
 *
 * Persistent bottom strip that floats above the GlassTabBar while
 * a focus session is active. Hidden entirely when no session is
 * on, so it doesn't compete for space during normal browsing.
 *
 * Anatomy (sermon NOT yet read today — primary CTA mode):
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │ 🛡  Read your sermon to unlock                          │
 *   │    Apps locked · 3:13                  [ Read sermon → ]│
 *   └────────────────────────────────────────────────────────┘
 *
 * Anatomy (sermon already completed — quiet status mode):
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │ ✓  Apps quieted · keep focusing                         │
 *   │    3:13 elapsed                                    End  │
 *   └────────────────────────────────────────────────────────┘
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │  Today   Practice   +   Library   Insights              │   ← GlassTabBar
 *   └────────────────────────────────────────────────────────┘
 *
 * Why a CTA-shaped strip (not a status pill)?
 *   The core promise of Closer is: your apps are blocked until
 *   you read today's sermon. Before the sermon is read, the strip
 *   should be the single most obvious "unlock" action on the
 *   screen — that's a CTA, not chrome. After the sermon is read,
 *   the urgency is gone and the strip relaxes into a quiet
 *   "now focusing" status with End as the only affordance.
 *
 * Visual language:
 *   • Same horizontal inset (16pt) and pill shape as GlassTabBar so
 *     the two read as a stacked pair, not two unrelated chips.
 *   • BlurView + themed backing matches the tab bar's frosted-glass
 *     treatment — keeps the pair coherent on colorful scroll
 *     content (book covers, gradient hero images).
 *   • Shield glyph in iOS-system-blue (matches FocusBanner /
 *     FocusToggle / focus session card) is the recurring focus
 *     color anchor across surfaces.
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
 *  the last item from being permanently occluded by the pill.
 *  Bumped from 56 → 82 when the pill became the primary
 *  "read your sermon to unlock" CTA instead of a glanceable
 *  status strip — the larger surface gives the headline +
 *  status line room to read AND keeps the iOS-blue Read pill
 *  tappable with a comfortable thumb target. */
const PILL_HEIGHT = 82;

/** Gap between the mini-player pill and whatever sits below it
 *  (the GlassTabBar pill on tabbed screens, the safe-area inset
 *  on stack screens). Small enough that the pair reads as one
 *  stacked component, large enough that the two pills don't
 *  visually touch. */
const PILL_GAP = 8;

/** Visible portion of the bottom tab bar above the safe-area inset.
 *  Updated to 49 — the native iOS UITabBar height that React
 *  Navigation's stock bottom tab bar renders at, now that the
 *  custom GlassTabBar wrapper has been dropped from
 *  app/(tabs)/_layout.tsx (the layout no longer passes a
 *  `tabBar={...}` prop, so the stock bar runs instead).
 *
 *  The full bar footprint the mini-player must clear is
 *  `insets.bottom + TAB_BAR_PILL_HEIGHT` — the stock bar adds its
 *  own safe-area inset baked into its bottom padding, same
 *  pattern the previous flush GlassTabBar used. */
const TAB_BAR_PILL_HEIGHT = 49;

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
  const { session, endSession } = useFocus();
  // Today's sermon — drives the "now playing"-style title in the
  // strip. The Moments provider always resolves a current sermon
  // (it falls back to day 1 if hydration hasn't completed), so
  // `todaysMoment.title` is always safe to read without nulling.
  const { todaysMoment } = useMoments();
  // useProgress() returns the ProgressContextValue directly (state +
  // mutators flattened together), NOT { progress }. Calling
  // `didCompleteToday(value)` is the documented usage. Destructuring
  // `{ progress }` like a wrapper made `progress` undefined and
  // crashed every render below.
  const progress = useProgress();
  const [ending, setEnding] = useState(false);

  // Has today's sermon been completed?
  // Drives the strip's two render modes:
  //   • false → primary CTA mode ("Read your sermon to unlock")
  //     this is the core unlock-loop moment. The strip is the
  //     single most obvious action on the screen.
  //   • true  → quiet status mode ("Apps quieted · keep focusing")
  //     the unlock urgency is gone; the strip relaxes into a
  //     calm "now focusing" status with only End as an affordance.
  // Read here (not memoized) — progress changes infrequently and
  // didCompleteToday is a simple set-lookup, not worth memo cost.
  const sermonCompleted = didCompleteToday(progress);

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
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!session || isPaused) return;
    // Reduce Motion: park the pulse halfway through its arc so the
    // halo reads as "lit" without ever moving. Holding at 0.5 gives
    // us the midpoint of the breath without the breathing — same
    // approach Apple uses on the iOS Now-Playing live indicator
    // when Reduce Motion is enabled.
    if (reducedMotion) {
      pulse.setValue(0.5);
      return;
    }
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
  }, [session, pulse, isPaused, reducedMotion]);

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
    // Body-tap routing is mode-dependent. The strip has two roles:
    //   • Sermon NOT read → the strip IS the "Read your sermon to
    //     unlock" CTA. Tapping anywhere on the body should send the
    //     user into the sermon flow — that's the primary action.
    //   • Sermon already read → no unlock CTA; the strip is now a
    //     status surface. Tapping the body falls back to the App
    //     Blocks editor so the user can manage the active session.
    //     (Previously this routed to the legacy Practice tab; that
    //     tab was removed when the bar consolidated to Home /
    //     Library / Profile, so we now go straight to the editor.)
    if (!sermonCompleted) {
      // Antechamber intro page was removed; scripture is the
      // first sermon beat now, so the unlock CTA on the mini
      // player drops the user straight into the verse screen.
      router.push("/sermon/scripture");
    } else {
      router.push("/settings/study-sessions");
    }
  }, [router, sermonCompleted]);

  if (!session || hidden) return null;

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
        accessibilityLabel={
          sermonCompleted
            ? `Focus session active. Apps quieted, keep focusing. ${timeLabel} ${timeMetaLabel.toLowerCase()}.${isPaused ? " Paused." : ""} Tap to manage.`
            : `Apps locked. Read today's sermon to unlock. ${timeLabel} elapsed.${isPaused ? " Paused." : ""} Tap to read the sermon.`
        }
        style={({ pressed }) => ({
          marginHorizontal: 16,
          height: PILL_HEIGHT,
          borderRadius: 24,
          overflow: "hidden",
          opacity: pressed ? 0.94 : 1,
          // Shadow lifts the pill off the screen contents behind it
          // so it reads as floating chrome rather than embedded
          // content. Black blur works for both themes. Slightly
          // taller pill = slightly heftier shadow so it still
          // feels appropriately lifted.
          shadowColor: "#000",
          shadowOpacity: 0.28,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
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
        {/* Soft iOS-blue inner glow when the strip is in CTA mode —
            faint enough not to compete with the headline but
            present enough to mark the strip as the "primary
            action of the screen". Skipped in the calm
            sermon-completed state so the strip relaxes. */}
        {!sermonCompleted ? (
          <View
            pointerEvents="none"
            style={{
              ...absoluteFill,
              borderRadius: 24,
              backgroundColor: FOCUS_ACCENT,
              opacity: isDark ? 0.06 : 0.05,
            }}
          />
        ) : null}
        {/* Border — drawn as an absolutely-positioned overlay rather
            than as a borderColor on the Pressable so the inner
            content padding isn't affected by border width. Tinted
            iOS-blue in CTA mode so the strip's edge picks up the
            accent the headline copy is pointing toward. */}
        <View
          pointerEvents="none"
          style={{
            ...absoluteFill,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: sermonCompleted
              ? pillBorderColor
              : `${FOCUS_ACCENT}55`,
          }}
        />

        <View className="flex-row items-center pl-3 pr-3 h-full">
          {/* Shield glyph in a soft iOS-blue halo. The halo
              breathes (scale + opacity) on the same pulse value
              that used to drive the live-dot, so the strip still
              has a "this is live" visual signal — the breath just
              lives on the shield now instead of a separate dot. */}
          <View
            style={{
              width: 42,
              height: 42,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: FOCUS_ACCENT,
                opacity: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.14, 0.26],
                }),
                transform: [
                  {
                    scale: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.88, 1.04],
                    }),
                  },
                ],
              }}
            />
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: `${FOCUS_ACCENT}33`,
                borderWidth: 1,
                borderColor: `${FOCUS_ACCENT}66`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {sermonCompleted ? (
                // Check inside a shield — sermon's been read, the
                // session has fulfilled its purpose, the user is
                // just riding it out. Native SF Symbol so the
                // glyph adopts iOS' system stroke weight + the
                // exact terminal-cap rounding Apple ships in
                // first-party apps.
                <SFSymbol
                  name="checkmark"
                  size={14}
                  weight="bold"
                  color={FOCUS_ACCENT}
                />
              ) : (
                // Lock — explicit "your apps are locked" metaphor.
                // The shield→sermon→unlock loop is the core promise
                // of the app, and the lock makes the locked half
                // of that loop unmistakable at a glance. `lock.fill`
                // is the canonical iOS "secured" glyph (Settings,
                // Privacy, Screen Time all use it).
                <SFSymbol
                  name="lock.fill"
                  size={14}
                  color={FOCUS_ACCENT}
                />
              )}
            </View>
          </View>

          {/* Title + subline. Reads like Spotify's now-playing
              strip: bold "track name" on top, quieter "artist +
              status" line underneath. The title is the actual
              sermon — gives the strip real context ("you are
              reading: When God Feels Silent") instead of the
              generic "Read your sermon to unlock" copy.
              numberOfLines={1} on both so a long sermon title
              ellipsises gracefully and never wraps into a third
              line that pushes the right-column buttons out of
              the container — which was the source of the
              earlier overflow bug. */}
          <View className="flex-1 pr-3 justify-center">
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "System",
                fontWeight: "700",
                color: colors.ink,
                fontSize: 15,
                letterSpacing: 0.05,
                lineHeight: 20,
              }}
            >
              {todaysMoment.title}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "System",
                fontWeight: "500",
                color: colors.inkMuted,
                fontSize: 12,
                marginTop: 2,
                letterSpacing: 0.05,
                opacity: isPaused ? 0.65 : 1,
              }}
            >
              {sermonCompleted
                ? `Apps quieted · ${timeLabel}${isPaused ? " · paused" : ""}`
                : `Reading to unlock · ${timeLabel}${isPaused ? " · paused" : ""}`}
            </Text>
          </View>

          {/* Right column — two side-by-side circular icon
              buttons, Spotify-style. The previous build stacked a
              wide "Read →" pill on top of a tiny "END" text link,
              which (a) overflowed the pill on small phones (the
              END label visibly bled outside the container) and
              (b) read as cluttered chrome rather than focused
              controls. Two equally-sized circles read instantly
              as "play / dismiss" — the now-playing idiom every
              user already knows.

              CTA mode (sermon unread):
                [ End circle ]  [ Play circle, iOS blue, primary ]
              Status mode (sermon completed):
                [ End circle ]  — no play; the work is done. */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              // Pad the right edge so the play button has visual
              // breathing room from the pill's rounded corner.
              // Without this the button hugs the curve and reads
              // as cropped.
              paddingRight: 4,
            }}
          >
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                handleEnd();
              }}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="End focus session"
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: endBg,
                opacity: pressed ? 0.55 : 1,
              })}
            >
              <SFSymbol
                name="xmark"
                size={12}
                weight="bold"
                color={endLabelColor}
              />
            </Pressable>
            {!sermonCompleted ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleOpen();
                }}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Read today's sermon to unlock your apps"
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: FOCUS_ACCENT,
                  opacity: pressed ? 0.86 : 1,
                  // Accent-tinted glow so the primary button
                  // reads as the focal point of the strip even
                  // against busy scroll backgrounds.
                  shadowColor: FOCUS_ACCENT,
                  shadowOpacity: 0.55,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                })}
              >
                {/* Play triangle — the universal "open / start"
                    icon. SF Symbol so the glyph carries Apple's
                    own optical centering (the system bakes the
                    1pt nudge-right that a raw centered triangle
                    needs to read as visually balanced). */}
                <SFSymbol name="play.fill" size={14} color="#FFFFFF" />
              </Pressable>
            ) : null}
          </View>
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
