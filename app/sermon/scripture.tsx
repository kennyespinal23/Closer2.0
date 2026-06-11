import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import * as haptics from "@/lib/haptics";
import { shareVerse } from "@/lib/share";
import { splitScripture } from "@/lib/moments";
import { getDailyImage } from "@/services/unsplashService";
import { useMoments } from "@/state/moments";
import { useColors } from "@/state/theme";

/**
 * Sermon scripture — the opening quote screen.
 *
 * Sits between the intro page and the first sermon panel:
 *   intro → [tap Begin] → scripture → [tap Continue] → panel/1
 *
 * The verse used to live as a card on the intro page. Pulling it
 * out into its own dedicated screen gives the scripture room to
 * breathe — the reader lands on a full-screen reverent quote
 * presentation BEFORE the sermon begins, with no other UI
 * competing for attention. This is the "you came here to sit
 * with this verse first" beat that the sermon then unfolds.
 *
 * Visual design:
 *   • Full-bleed sky photograph as the backdrop — clear blue
 *     sky at the top, horizon line, white cloud cover at the
 *     bottom. A 55% black dim wash sits over the entire image
 *     so white text stays legible across both the darker sky
 *     and the brighter cloud regions. The verse reads as
 *     floating against open sky.
 *   • Verse text large (26pt), centered, PlusJakartaSans
 *     Medium with generous leading. Long verses still fit
 *     comfortably; short verses sit cleanly in the middle
 *     third of the screen.
 *   • Slim accent-tinted divider + tracked-caps reference
 *     below the verse — the citation beat ("MARK 5:34"),
 *     nothing else competing for attention.
 *   • Floating glass close X (top-left) → router.back()
 *     returns to the intro page.
 *   • Floating glass Share button (top-right) → opens the
 *     system share sheet with the verse + reference + a short
 *     Closer attribution.
 *   • Big white Continue pill at the bottom — same primary
 *     CTA the intro uses so the consecutive "Begin → Continue"
 *     taps feel of-a-piece.
 *
 * The verse fades + lifts in on mount — a quiet arrival that
 * respects the scripture beat rather than slamming into view.
 * No eyebrow chrome, no decorative quote glyph: the verse and
 * its citation are the entire stage.
 */
export default function SermonScriptureScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { todaysMoment } = useMoments();
  const scripture = useMemo(
    () => splitScripture(todaysMoment.scripture),
    [todaysMoment.scripture],
  );

  // Per-day Unsplash backdrop. `null` until the fetch resolves
  // (or stays null on missing key / offline / 429 / no
  // `imageQuery` on the sermon — see `getDailyImage()`).
  //
  // While null, the screen shows a solid #0A0A0A black backing.
  // No bundled fallback image, no swap-flash — when the
  // Unsplash photo finishes downloading, its onLoad fires and
  // we fade the photo in over 600ms over the top of the black.
  // The user sees: solid black → gentle reveal of the photo,
  // never an abrupt swap.
  //
  // `getDailyImage()` caches per (day, calendar-date) pair in
  // AsyncStorage, so on second-and-subsequent loads of the
  // same sermon on the same date the URL is in-hand
  // immediately and the network image cache typically returns
  // the bytes from local storage — the fade still plays but
  // onLoad fires almost instantly.
  //
  // The `cancelled` flag guards against a setState after
  // unmount — the verse screen is short-lived (user typically
  // hits Continue inside ~6s) and the Unsplash request can
  // take longer on a slow connection.
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const query = todaysMoment.imageQuery;
    if (!query) return;
    getDailyImage(query, todaysMoment.day).then((url) => {
      if (!cancelled) setImageUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [todaysMoment.imageQuery, todaysMoment.day]);

  // Backdrop cross-fade. Held at 0 until the network image
  // reports onLoad — at that point we ramp to 1 over 600ms,
  // which gently dissolves the photo in over the solid black
  // backing. Native-driven so it runs off the JS thread and
  // doesn't compete with the verse + continue animations
  // already running on mount.
  const backdropFade = useRef(new Animated.Value(0)).current;

  // Mount choreography — two beats, deliberately glacial:
  //
  //   1. The verse fades + lifts in over 4200 ms with a 1100 ms
  //      lead-in. The whole rise takes ~5.3 seconds, which
  //      feels almost painfully slow as a button animation but
  //      reads as reverent for scripture — the words don't
  //      slam into view, they materialize. The reader's eye
  //      has time to settle, take a breath, and meet the verse
  //      where it lands rather than where it loads.
  //
  //   2. The Continue pill drifts in 5800 ms after mount, well
  //      AFTER the verse has finished settling. The CTA is the
  //      third beat (after the verse appears and the eye
  //      finishes reading it), so it whispers into view (1400
  //      ms fade) once the reader is ready for the next step
  //      rather than competing with the scripture for the
  //      first glance.
  //
  // Tuned (and re-tuned, repeatedly) for "much slower than
  // feels right at a desk, much closer to the right pace on a
  // phone in your hand at the start of a quiet moment." If the
  // verse ever feels too slow on a dev machine, that's the
  // indicator it's correct — it's meant to make you slow down.
  //
  // Both animations use native driver so they stay buttery
  // during the navigation transition.
  const verseAnim = useRef(new Animated.Value(0)).current;
  const continueAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(verseAnim, {
      toValue: 1,
      duration: 4200,
      delay: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.timing(continueAnim, {
      toValue: 1,
      duration: 1400,
      delay: 5800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [verseAnim, continueAnim]);

  const verseTranslateY = verseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  const continueTranslateY = continueAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  const handleContinue = () => {
    // Tap commits the reader to the sermon body. Same medium
    // haptic Begin uses on the intro so the two consecutive
    // taps feel of-a-piece.
    haptics.tap();
    router.push("/sermon/panel/1");
  };

  /**
   * System share sheet — drops the verse + reference + a
   * short Closer attribution as plain text. The user picks
   * the destination (Messages, Notes, IG story, etc.).
   *
   * We don't render the share button's tap result inline —
   * the OS sheet IS the response. Failures (user cancels,
   * no share targets available) are silently swallowed
   * because share is a soft action and surfacing an error
   * banner for a tap-and-dismiss would feel punitive.
   */
  const handleShare = async () => {
    haptics.soft();
    if (!scripture.text) return;
    // Centralized in lib/share so the verse footer ("via Closer"),
    // citation format, and Mail subject line are identical to every
    // other verse-share surface (chapter reader, check-ins, mood
    // delivery). Future Universal Link lands here in one place.
    await shareVerse({
      text: scripture.text,
      reference: scripture.reference,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      {/* ─── Backdrop ───────────────────────────────────────
          Conditional Animated.Image for the Unsplash photo.
          Mounted only once `imageUrl` resolves. Held at
          opacity 0 until the network image fires `onLoad`
          (meaning the bytes are downloaded and the image is
          ready to render) — at that point we fade to 1 over
          600ms, gently dissolving the photo in over the
          solid black backing. The user never sees a hard
          swap or a half-loaded image.
          
          Until the fetch resolves (and during the download
          window), the solid `#0A0A0A` backing on the parent
          View shows through. With the 55% dim overlay on
          top it reads as intentional dark mode rather than
          "image missing." */}
      {imageUrl ? (
        <Animated.Image
          source={{ uri: imageUrl }}
          onLoad={() => {
            Animated.timing(backdropFade, {
              toValue: 1,
              duration: 600,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }).start();
          }}
          style={[StyleSheet.absoluteFill, { opacity: backdropFade }]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}

      {/* ─── Dark overlay ──────────────────────────────────
          55% black dim wash sits over whatever is currently
          visible — solid #0A0A0A during the load window,
          the Unsplash photo once it's faded in. The wash is
          high enough to keep the white verse + caps
          reference legible across any image content
          Unsplash may return — sunlit landscapes, near-
          white cloud cover, snow, etc. — without depending
          on per-photo color science.
          
          pointerEvents="none" so taps fall through to the
          floating chips and Continue pill above. */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0, 0, 0, 0.55)" },
        ]}
      />

      {/* ─── Verse content ──────────────────────────────────
          Centered vertically over the dimmed sky with wide
          horizontal padding (32 vs the app's usual 24) so
          line length stays editorial — short lines force
          long verses to wrap into a poem-like stanza. Padding
          accounts for the floating Close/Share at the top
          and the Continue pill at the bottom. */}
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: 32,
          paddingTop: insets.top + 72,
          paddingBottom: insets.bottom + 120,
        }}
      >
        {/* The verse — large, centered, generous leading.
            PlusJakartaSans Medium 26/40 gives long verses
            room without crowding; short verses sit cleanly
            in the middle third. Letter-spacing slightly tight
            (-0.3) so the line reads as a composed quote
            rather than a paragraph. */}
        {scripture.text ? (
          <Animated.Text
            style={{
              opacity: verseAnim,
              transform: [{ translateY: verseTranslateY }],
              color: "#FFFFFF",
              fontFamily: "PlusJakartaSans_500Medium",
              fontSize: 26,
              lineHeight: 40,
              textAlign: "center",
              letterSpacing: -0.3,
              // Strong drop shadow doing the heavy lifting for
              // legibility now that the global dim is only 15%
              // — the shadow casts a tight halo around each
              // glyph that keeps the verse readable against
              // the brightest cloud patches.
              textShadowColor: "rgba(0, 0, 0, 0.75)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 14,
            }}
          >
            {scripture.text}
          </Animated.Text>
        ) : null}

        {/* Reference — small caps, tracked, muted white. Slim
            white hairline above marks the citation beat. This
            is the ONLY mark below the verse — no eyebrow, no
            decorative glyph, no accent tint. Just the
            citation. */}
        <Animated.View
          style={{
            opacity: verseAnim,
            transform: [{ translateY: verseTranslateY }],
            alignItems: "center",
            marginTop: 32,
          }}
        >
          <View
            style={{
              width: 32,
              height: 1,
              backgroundColor: "rgba(255, 255, 255, 0.45)",
              marginBottom: 14,
              borderRadius: 1,
            }}
          />
          <Text
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 12,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            {scripture.reference}
          </Text>
        </Animated.View>
      </View>

      {/* ─── Floating close X (top-left) ────────────────────
          Wrapped in a position-absolute View rather than
          putting position styles on the Pressable directly —
          Pressable's `style` callback form (used to render the
          pressed-state opacity) drops `position: "absolute"`
          on iOS in this RN version, causing the chip to flow
          inline at the bottom of the page. Wrapping with a
          plain View pins the chip reliably at the top edge. */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: 16,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel="Close scripture"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View style={GLASS_DISC_STYLE}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M6 6l12 12M6 18L18 6"
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            </Svg>
          </View>
        </Pressable>
      </View>

      {/* ─── Floating Share (top-right) ─────────────────────
          Same wrapping pattern as the close X above (see
          comment there). Opens the system share sheet with
          the verse text + reference + a short Closer
          attribution. */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 8,
          right: 16,
        }}
      >
        <Pressable
          onPress={handleShare}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel="Share scripture"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View style={GLASS_DISC_STYLE}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 3v13M7 8l5-5 5 5"
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M5 12v6a2 2 0 002 2h10a2 2 0 002-2v-6"
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </Pressable>
      </View>

      {/* ─── Continue CTA ───────────────────────────────────
          Big white pill identical to the intro's Begin CTA so
          the consecutive "Begin → Continue" taps feel of-a-
          piece. Anchored to the bottom with safe-area-aware
          padding to clear the home indicator.
          
          Wrapped in an Animated.View that fades + lifts in
          1100ms after mount (well after the verse has settled),
          so the CTA arrives as the second beat of the screen
          rather than competing with the scripture for the
          reader's first glance. */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: insets.bottom + 16,
          left: 24,
          right: 24,
          opacity: continueAnim,
          transform: [{ translateY: continueTranslateY }],
        }}
      >
        <Pressable
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue to sermon"
          style={({ pressed }) => ({
            opacity: pressed ? 0.92 : 1,
            alignSelf: "stretch",
          })}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 999,
              paddingVertical: 18,
              paddingHorizontal: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#FFFFFF",
              shadowOpacity: 0.2,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 0 },
              elevation: 6,
            }}
          >
            <Text
              style={{
                color: "#000000",
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 16,
                letterSpacing: 0.1,
                marginRight: 10,
              }}
            >
              Continue
            </Text>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="#000000"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

/**
 * Shared style for the two floating top-edge glass discs (close
 * X on the left, Share on the right).
 *
 * Tuned for safety: the disc has a more opaque dark fill (0.65)
 * and a brighter hairline border (0.22) so the chip remains
 * clearly visible against any backdrop — bright sky, deep sky,
 * or pure-black fallback if the photograph fails to load. An
 * earlier 0.45 / 0.12 treatment was disappearing entirely on a
 * black bg and reading as "off-screen" to users. The disc still
 * reads as glass over the photo; it just no longer vanishes.
 */
const GLASS_DISC_STYLE = {
  width: 38,
  height: 38,
  borderRadius: 19,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  backgroundColor: "rgba(0, 0, 0, 0.65)",
  borderWidth: 1,
  borderColor: "rgba(255, 255, 255, 0.22)",
};
