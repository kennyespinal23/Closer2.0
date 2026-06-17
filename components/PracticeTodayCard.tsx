import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import * as haptics from "@/lib/haptics";
import { useColors } from "@/state/theme";

/**
 * PracticeTodayCard — the swipe-up "practice for today" sheet
 * that overlays the bottom of The Landing panel (panel 4) right
 * before The Prayer.
 *
 * Lifecycle:
 *   1. Mounts in PEEK state — only the rounded card top (~140pt)
 *      pokes above the bottom edge of the screen, showing the
 *      grabber handle, the "Practice today" eyebrow, and the
 *      "Swipe up to receive" subtitle.
 *   2. The user expands the card by either dragging the handle
 *      / card body upward (PanResponder, ~60pt or 0.6 vy beats
 *      threshold) or tapping anywhere on the peek region.
 *   3. In EXPANDED state the full practice copy is visible inside
 *      a scrollable interior, with a "Continue to prayer" pill at
 *      the bottom of the card.
 *   4. The user advances to The Prayer by either tapping the
 *      Continue pill OR dragging the card back down (>100pt or
 *      0.6 vy threshold). Both routes call `onAdvance` after a
 *      brief slide-off animation so the gesture feels committed.
 *
 * The card never re-collapses into the peek state — once it's
 * been opened, the user has either read the practice or actively
 * dismissed it; in both flows the next step is The Prayer, so
 * there is no "go back to peek" path. This is intentional: the
 * Landing → Practice → Prayer beat is a single forward arc with
 * one engagement point in the middle, not a sheet the user can
 * juggle.
 *
 * Why a PanResponder + Animated.Value (not react-native-
 * reanimated or a gesture-handler bottom-sheet library)? The
 * card has exactly two snap positions and a single axis of
 * motion — the additional dependency surface of a sheet library
 * is overkill, and PanResponder + Animated.Value plays cleanly
 * with the SafeAreaView + ScrollView already inside the panel
 * route without needing GestureHandlerRootView plumbing.
 */
export function PracticeTodayCard({
  text,
  firstName,
  accent,
  onAdvance,
}: {
  /** The raw practice copy from `panel.practiceToday`. May contain
   *  the literal `[name]` token which we interpolate with
   *  `firstName`, and `\n\n` paragraph breaks. */
  text: string;
  /** The user's first name from onboarding/preferences, with the
   *  "friend" fallback already applied by the caller. */
  firstName: string;
  /** Shared SERMON_ACCENT color so the Continue pill inside the
   *  card matches the editorial red threaded through the rest of
   *  the sermon flow. */
  accent: string;
  /** Called when the user advances out of the practice — either
   *  by tapping Continue or by swiping the open card back down.
   *  The caller is responsible for routing to The Prayer. */
  onAdvance: () => void;
}) {
  const colors = useColors();
  const { height: screenHeight } = useWindowDimensions();

  // ─── Geometry ────────────────────────────────────────────────
  // The card has two snap positions:
  //   • PEEK     — only the top ~140pt is visible (handle +
  //                "Practice today" eyebrow + "Swipe up" hint).
  //   • EXPANDED — the card fills ~78% of the screen so the
  //                practice copy has room without ever fully
  //                covering the Landing panel above (the
  //                Landing's body should still glance through
  //                at the top so the user keeps spatial
  //                continuity with what they were reading).
  //
  // We compute these once per mount from the screen height so
  // the snap targets adapt to tablet / large-phone form factors
  // without hard-coded magic numbers.
  const PEEK_HEIGHT = 140;
  const EXPANDED_HEIGHT = Math.min(screenHeight * 0.78, screenHeight - 80);
  const peekOffset = EXPANDED_HEIGHT - PEEK_HEIGHT;

  // translateY animates the card up (negative direction). The
  // card's height is EXPANDED_HEIGHT and it's anchored to the
  // bottom of the screen via `bottom: 0`, so:
  //   • translateY = peekOffset  → card sits at peek
  //   • translateY = 0           → card sits at expanded
  //   • translateY > peekOffset  → card slides off-screen
  //                                (used on advance)
  const translateY = useRef(new Animated.Value(peekOffset)).current;
  const [expanded, setExpanded] = useState(false);
  const gestureStartOffset = useRef(peekOffset);

  // Keep the animated value aligned when layout geometry changes
  // (rotation, dynamic type, first layout pass). Without this the
  // card can mount with a stale offset if screenHeight wasn't
  // final on the first render.
  useEffect(() => {
    translateY.setValue(peekOffset);
    gestureStartOffset.current = peekOffset;
  }, [peekOffset, translateY]);

  // ─── Name interpolation ──────────────────────────────────────
  // The catalog ships practice copy with the literal token
  // `[name]` (e.g. "Remember [name] — Jesus knew where Lazarus
  // was every hour..."). We replace every occurrence with the
  // user's first name. The caller already applied the "friend"
  // fallback so we never render a bare "[name]" or an empty
  // string. Memoized so the replacement only runs when the text
  // or name actually changes (effectively once per mount).
  const interpolated = useMemo(
    () => text.replace(/\[name\]/g, firstName),
    [text, firstName],
  );

  const paragraphs = useMemo(
    () =>
      interpolated
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
    [interpolated],
  );

  // ─── Snap handlers ───────────────────────────────────────────
  const expand = useCallback(() => {
    haptics.tap();
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 12,
    }).start();
    setExpanded(true);
  }, [translateY]);

  const snapBackToPeek = useCallback(() => {
    Animated.spring(translateY, {
      toValue: peekOffset,
      useNativeDriver: true,
      tension: 80,
      friction: 14,
    }).start();
  }, [peekOffset, translateY]);

  const snapBackToExpanded = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 14,
    }).start();
  }, [translateY]);

  // Slide the card fully off the bottom of the screen, then
  // invoke onAdvance once the animation lands. A short 240 ms
  // commit feels like the card "delivers" the user into the
  // prayer rather than an instantaneous teleport. We use timing
  // (not spring) here so the slide is uniform — a spring at this
  // distance would bounce or overshoot the off-screen target.
  const advanceWithSlide = useCallback(() => {
    haptics.tap();
    Animated.timing(translateY, {
      toValue: EXPANDED_HEIGHT + 40,
      duration: 240,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onAdvance();
    });
  }, [EXPANDED_HEIGHT, onAdvance, translateY]);

  // ─── Pan gesture ─────────────────────────────────────────────
  // We freeze the starting offset at gesture start so the drag
  // calculation is relative to where the card actually was when
  // the finger landed, not where it has since moved. Without this
  // a quick re-grab during an in-flight spring snaps the card to
  // a wrong absolute position. We capture `expanded` into a ref
  // for the same reason — the PanResponder closure would
  // otherwise see stale state.
  const expandedRef = useRef(expanded);
  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  const panResponder = useRef(
    PanResponder.create({
      // Don't claim the gesture on touch start — let taps reach
      // the Pressable / Continue button. Claim only once the
      // finger has actually moved vertically by more than 6pt,
      // which is the standard iOS bottom-sheet drag threshold.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dy) > 6 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderGrant: () => {
        // Snapshot where the card currently sits so we can
        // compute "starting position + drag delta" cleanly.
        // @ts-expect-error — Animated.Value exposes _value at runtime; the type just doesn't surface it.
        gestureStartOffset.current = translateY._value;
      },
      onPanResponderMove: (_, gs) => {
        // Clamp so the user can't drag the card above its
        // expanded ceiling (translateY < 0) or below the peek
        // floor in EXPANDED state. In peek state we allow
        // dragging slightly past the floor (rubber band) so
        // the gesture still feels alive.
        const raw = gestureStartOffset.current + gs.dy;
        const floor = expandedRef.current ? EXPANDED_HEIGHT + 40 : peekOffset;
        const ceiling = 0;
        const clamped = Math.max(ceiling, Math.min(floor, raw));
        translateY.setValue(clamped);
      },
      onPanResponderRelease: (_, gs) => {
        // The release-time policy is two-axis: did the gesture
        // travel far enough OR did it fling fast enough? Both
        // pass the threshold. This matches iOS Music's
        // mini-player → now-playing sheet, which feels alive
        // because a fast small flick still commits.
        if (!expandedRef.current) {
          // PEEK → expand if user dragged up far enough
          if (gs.dy < -60 || gs.vy < -0.5) {
            expand();
          } else {
            snapBackToPeek();
          }
        } else {
          // EXPANDED → advance to prayer if user dragged down
          // far enough; otherwise snap back to expanded.
          if (gs.dy > 100 || gs.vy > 0.6) {
            advanceWithSlide();
          } else {
            snapBackToExpanded();
          }
        }
      },
    }),
  ).current;

  // ─── Visual cross-fades ──────────────────────────────────────
  // PEEK subtitle ("Swipe up to receive") fades out as the card
  // rises into expanded. Practice body fades in over the same
  // interval. Both are driven from translateY with an INCREASING
  // inputRange — Animated requires monotonically non-decreasing
  // inputRange values; the earlier `[peekOffset, peekOffset *
  // 0.66]` ordering was backwards and crashed panel 4 at runtime.
  //
  //   translateY = peekOffset → card in peek → subtitle visible
  //   translateY = 0          → card expanded → body visible
  const peekOpacity = translateY.interpolate({
    inputRange: [0, peekOffset],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const bodyOpacity = translateY.interpolate({
    inputRange: [0, peekOffset],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  // Backdrop dim — grows as the card rises from peek → expanded.
  const scrimOpacity = translateY.interpolate({
    inputRange: [0, peekOffset],
    outputRange: [0.38, 0],
    extrapolate: "clamp",
  });

  return (
    <>
      {/* Backdrop scrim — full-screen, painted BEHIND the card.
          Sits with pointerEvents: 'none' so taps still reach the
          Landing's body when the card is in peek state; once the
          scrim opacity climbs (card expanded) the visual recede
          handles the focus shift without us actually intercepting
          taps. This keeps the underlying screen tappable in edge
          cases (e.g. pull-to-refresh in the body scroll above). */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          backgroundColor: "#000",
          opacity: scrimOpacity,
        }}
      />

      <Animated.View
        {...panResponder.panHandlers}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          // Anchored to the bottom edge — the card's vertical
          // position is driven entirely by translateY so we never
          // animate `bottom` (which would invalidate native
          // layer caching).
          bottom: 0,
          height: EXPANDED_HEIGHT,
          backgroundColor: colors.surfaceSecondary,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          // Soft elevation lift — a single subtle shadow above
          // the card so it reads as floating over the body.
          // Spread is intentionally small (radius 18) so the
          // shadow doesn't leak halo onto the bottom of the
          // screen below; the card is anchored at the bottom
          // edge so a wider radius would just paint a glow
          // BELOW the visible page.
          shadowColor: "#000",
          shadowOpacity: 0.22,
          shadowOffset: { width: 0, height: -8 },
          shadowRadius: 18,
          elevation: 12,
          transform: [{ translateY }],
        }}
      >
        {/* Grabber handle — the standard iOS bottom-sheet
            affordance. 40×4pt rounded bar at the top of the
            card, centered. Tapping it in peek expands; tapping
            in expanded advances. Wrapped in a Pressable with a
            generous hitSlop so the tap target meets the 44pt
            HIG minimum without painting a 44pt slab. */}
        <Pressable
          onPress={() => {
            if (expandedRef.current) {
              advanceWithSlide();
            } else {
              expand();
            }
          }}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel={
            expanded
              ? "Continue to prayer"
              : "Swipe up or tap to receive today's practice"
          }
          style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.borderStrong,
            }}
          />
        </Pressable>

        {/* PEEK header — always rendered, but the "Swipe up to
            receive" hint fades out as the card opens. The
            "PRACTICE TODAY" eyebrow stays visible in both states
            so the user always knows what the card is. */}
        <View
          style={{
            paddingHorizontal: 28,
            paddingTop: 10,
            paddingBottom: 4,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: accent,
              fontFamily: "System",
              fontWeight: "600",
              fontSize: 12,
              lineHeight: 14,
              letterSpacing: 0.8,
            }}
          >
            PRACTICE TODAY
          </Text>
          <Animated.Text
            style={{
              color: colors.inkSecondary,
              fontFamily: "System",
              fontWeight: "500",
              fontSize: 15,
              lineHeight: 22,
              marginTop: 8,
              opacity: peekOpacity,
              textAlign: "center",
            }}
          >
            Swipe up to receive
          </Animated.Text>
        </View>

        {/* EXPANDED body — fades in as the card rises. Lives
            inside a ScrollView so long practice copy (3+
            paragraphs, the maximum the catalog ships) can scroll
            cleanly on smaller phones. pointerEvents = 'auto'
            during EXPANDED via the wrapping pan responder, so
            scrolling AND swipe-down-to-advance both work — the
            PanResponder yields to the inner ScrollView for
            vertical drags inside the body but reclaims them
            once the user is dragging the card's chrome. */}
        <Animated.View
          style={{ flex: 1, opacity: bodyOpacity, paddingTop: 12 }}
          pointerEvents={expanded ? "auto" : "none"}
        >
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 28,
              paddingTop: 16,
              paddingBottom: 32,
            }}
            showsVerticalScrollIndicator={false}
          >
            {paragraphs.map((p, i) => (
              <Text
                key={i}
                style={{
                  color: colors.ink,
                  fontFamily: "System",
                  fontWeight: "500",
                  fontSize: 18,
                  lineHeight: 28,
                  letterSpacing: -0.1,
                  marginBottom: 18,
                }}
              >
                {p}
              </Text>
            ))}

            {/* Continue to prayer — the explicit advance affordance
                inside the card. Swipe-down is the gesture-native
                shortcut, but the labeled pill is the safety net
                for users who don't intuit the dismiss gesture.
                Painted in the shared SERMON_ACCENT so it pairs
                visually with the Continue pill the user has seen
                on Panels 1-3. */}
            <Pressable
              onPress={advanceWithSlide}
              accessibilityRole="button"
              accessibilityLabel="Continue to prayer"
              style={({ pressed }) => ({
                marginTop: 20,
                backgroundColor: accent,
                borderRadius: 100,
                paddingVertical: 18,
                paddingHorizontal: 24,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "System",
                  fontWeight: "600",
                  fontSize: 17,
                  textAlign: "center",
                  letterSpacing: -0.2,
                }}
              >
                Continue to prayer
              </Text>
            </Pressable>

            {/* Secondary affordance hint — a small caption under
                the Continue pill that names the gesture-native
                path ("or swipe down"). Caps-tracked muted small
                so it reads as a footnote, not a competing CTA.
                Hidden once the user has clearly engaged with the
                card (we just always render it in EXPANDED state
                since it's only ever visible in expanded). */}
            <Text
              style={{
                color: colors.inkMuted,
                fontFamily: "System",
                fontWeight: "500",
                fontSize: 12,
                lineHeight: 16,
                letterSpacing: 0.4,
                textAlign: "center",
                marginTop: 14,
              }}
            >
              or swipe down to continue
            </Text>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </>
  );
}
