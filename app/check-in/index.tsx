import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { ImageSourcePropType } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { FadeIn } from "@/components/FadeIn";
import * as haptics from "@/lib/haptics";
import { MOODS, type Mood } from "@/constants/moods";
import { useColors } from "@/state/theme";

// ─────────────────────────────────────────────────────────────────
// Grid geometry
// ─────────────────────────────────────────────────────────────────
// 20 moods → a clean 5×4 grid. Card widths are computed in pixels
// from the live window width so the columns never wrap irregularly
// (percentages + columnGap end up oscillating between 4 and 5 cols
// because RN's wrap math doesn't subtract gaps from the limit).
const COLS = 5;
const OUTER_PX = 18;
const COL_GAP = 8;
const ROW_GAP = 10;

// Approximate height of the confirmation panel — used to pad the
// scroll content so the bottom row of cards never hides under it.
const PANEL_HEIGHT_PX = 220;

/**
 * Step 1 of the check-in: "How are you?"
 *
 * Renders the 20-mood catalog as a 5×4 grid. Tapping a card SELECTS
 * the mood (highlights it with the mood's swatch color) and slides
 * up a confirmation panel at the bottom of the screen. The panel
 * shows the head illustration, the mood name, a short description
 * of what that feeling means, and a primary "Receive your verse"
 * CTA. Picking a different card swaps the selection in-place; the
 * panel only dismisses when the user confirms, taps the X chip in
 * the panel, or backgrounds the screen.
 *
 * Why a confirm step (vs immediate navigation):
 *   • The mood word + a one-line description gives the user a
 *     moment of reflection — "yes, that's me right now" — which is
 *     the whole point of a check-in.
 *   • It prevents accidental taps from triggering a full screen
 *     transition + check-in log entry.
 *   • It makes the swatch color land visually before the verse
 *     screen inherits that same tint, so the moment "ties together".
 */
export default function MoodSelectScreen() {
  const router = useRouter();
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Lock 5 columns regardless of device width. Floor + a 1px shave
  // per card protect against floating-point + sub-pixel rendering
  // pushing the row width just past the container width (which RN
  // resolves by wrapping the last card to a new line).
  const cardWidth = Math.floor(
    (screenWidth - OUTER_PX * 2 - COL_GAP * (COLS - 1)) / COLS,
  ) - 1;

  const [selected, setSelected] = useState<Mood | null>(null);

  const handlePick = (mood: Mood) => {
    // Soft haptic on every pick — the selection IS the moment of
    // self-honesty, so the tap deserves a tactile cue. We use
    // `soft` (not `tap`) because it's a contemplative selection,
    // not a committing action — the commit comes when they tap
    // "Receive your verse" in the panel below.
    haptics.soft();
    setSelected(mood);
  };

  const handleConfirm = () => {
    if (!selected) return;
    // Thud — heavy commit. This is the moment the user
    // commits to spending time on this feeling; the screen
    // transitions and the verse arrives shortly after. Heavier
    // than the soft() on mood-pick because picking is
    // exploratory and confirming is decisive.
    haptics.thud();
    router.push(`/check-in/${selected.id}` as never);
  };

  const handleDismissPanel = () => {
    // Tick — light selection-clear feedback. Same grammar as
    // the "X" button in iOS Notes header when clearing search.
    haptics.tick();
    setSelected(null);
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* Mood-tinted ambient atmosphere — the WHOLE screen takes
          on the chosen mood's color as soon as the user picks one.
          When no mood is selected, the canvas is bare black. When
          a mood is picked, MoodAtmosphere crossfades its radial
          gradient to that mood's swatch so the room itself feels
          like it's responding to what they said.
          Sits behind everything (absolute, pointerEvents none) so
          taps still go to the grid + panel. */}
      <MoodAtmosphere mood={selected} />

      <ScrollView
        contentContainerStyle={{
          // Pad the bottom enough that the last row of cards stays
          // tappable above the panel when it's open. When the panel
          // is closed we still leave room so the layout doesn't shift.
          paddingBottom: selected ? PANEL_HEIGHT_PX + 24 : 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top bar — Close button only ─────────────────── */}
        <View className="px-6 pt-2 flex-row items-center justify-between">
          <Text
            className="text-ink-subtle text-[11px] tracking-[3px] uppercase"
            style={{ fontFamily: "System", fontWeight: "700" }}
          >
            Check-in
          </Text>
          <Pressable
            hitSlop={12}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close check-in"
            className="w-9 h-9 rounded-full bg-accent-soft border border-border items-center justify-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path
                d="M6 6l12 12M18 6l-6 6-6 6"
                stroke={colors.ink}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </Pressable>
        </View>

        {/* ─── Headline ────────────────────────────────────── */}
        <FadeIn delayMs={50} durationMs={700}>
          <View className="px-6 mt-7">
            <Text
              className="text-ink text-[30px] leading-[36px] tracking-[-0.4px]"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              How are you,{"\n"}really?
            </Text>
            <Text
              className="text-ink-muted text-[14px] leading-[20px] mt-3"
              style={{ fontFamily: "System", fontWeight: "400" }}
            >
              Pick what&apos;s closest. A verse will meet you where you are.
            </Text>
          </View>
        </FadeIn>

        {/* ─── Mood grid ───────────────────────────────────── */}
        <FadeIn delayMs={200} durationMs={900}>
          <View
            className="mt-7 flex-row flex-wrap"
            style={{
              paddingHorizontal: OUTER_PX,
              rowGap: ROW_GAP,
              columnGap: COL_GAP,
            }}
          >
            {MOODS.map((mood, i) => (
              <MoodCard
                key={mood.id}
                label={mood.label}
                image={mood.image}
                swatch={mood.swatch}
                width={cardWidth}
                isSelected={selected?.id === mood.id}
                delayMs={250 + i * 22}
                onPress={() => handlePick(mood)}
              />
            ))}
          </View>
        </FadeIn>
      </ScrollView>

      {/* ─── Bottom confirmation panel ───────────────────────
          Lives outside the ScrollView so it floats above the grid
          and the safe-area bottom inset is honored. Slides in from
          below when a mood is selected; replaces its contents
          in-place when the selection changes. */}
      <ConfirmationPanel
        mood={selected}
        bottomInset={insets.bottom}
        onConfirm={handleConfirm}
        onDismiss={handleDismissPanel}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// MoodCard — single tile in the 5-column grid
// ─────────────────────────────────────────────────────────────────

function MoodCard({
  label,
  image,
  swatch,
  width,
  isSelected,
  delayMs,
  onPress,
}: {
  label: string;
  image: ImageSourcePropType;
  swatch: string;
  width: number;
  isSelected: boolean;
  delayMs: number;
  onPress: () => void;
}) {
  const colors = useColors();
  // Scale the image to most of the card width but leave room for
  // the label underneath. The 10pt floor keeps it readable when the
  // card lands on a very narrow device.
  const imageSize = Math.max(40, Math.min(60, width - 16));
  return (
    <FadeIn delayMs={delayMs} durationMs={700}>
      {/* Pattern: <Pressable> owns the hitbox, an inner <View> owns
          ALL visual styling. When Pressable's style is a function
          ({pressed}) => ({...}), iOS occasionally drops or ignores
          backgroundColor/borderWidth/width — wrapping the visuals
          in a plain View sidesteps that and keeps the grid layout
          deterministic. */}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`I'm feeling ${label.toLowerCase()}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, width })}
      >
        <View
          style={{
            width: "100%",
            // Selected: tint background + colored ring sampled from
            // the mood's own swatch. Stays in the same grid slot so
            // the layout doesn't jitter when swapping selections —
            // both selected and unselected use the same 1.5 border
            // width so width never changes between states.
            backgroundColor: isSelected
              ? hexAlpha(swatch, 0.16)
              : colors.surface,
            borderColor: isSelected ? swatch : colors.border,
            borderWidth: 1.5,
            borderRadius: 16,
            paddingVertical: 10,
            alignItems: "center",
          }}
        >
          <Image
            source={image}
            style={{ width: imageSize, height: imageSize }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <Text
            className="text-ink text-[11px] mt-1.5 text-center px-0.5"
            style={{ fontFamily: "System", fontWeight: "700" }}
            numberOfLines={2}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </FadeIn>
  );
}

// ─────────────────────────────────────────────────────────────────
// ConfirmationPanel — slides up when a mood is selected
// ─────────────────────────────────────────────────────────────────

function ConfirmationPanel({
  mood,
  bottomInset,
  onConfirm,
  onDismiss,
}: {
  mood: Mood | null;
  bottomInset: number;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const colors = useColors();
  // We keep a "last mood" buffer so the panel can finish its exit
  // animation showing the previous mood's content (otherwise the
  // contents would flash blank on dismiss).
  const [renderedMood, setRenderedMood] = useState<Mood | null>(mood);
  const slide = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = shown

  useEffect(() => {
    if (mood) {
      setRenderedMood(mood);
      Animated.timing(slide, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slide, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        // Clear the buffer once the panel is fully off-screen so the
        // next selection starts from the bottom again.
        if (finished) setRenderedMood(null);
      });
    }
  }, [mood, slide]);

  if (!renderedMood) return null;

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [PANEL_HEIGHT_PX + bottomInset + 32, 0],
  });

  return (
    <Animated.View
      pointerEvents={mood ? "auto" : "none"}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: Math.max(bottomInset, 16),
        paddingHorizontal: 16,
        transform: [{ translateY }],
      }}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: hexAlpha(renderedMood.swatch, 0.32),
          borderWidth: 1,
          borderRadius: 22,
          padding: 16,
          // Soft glow tied to the mood's swatch — gives the card a
          // hint of the color that the verse halo will also use.
          shadowColor: renderedMood.swatch,
          shadowOpacity: 0.35,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
        }}
      >
        {/* Top row: image + name/description + dismiss chip */}
        <View className="flex-row items-center">
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: hexAlpha(renderedMood.swatch, 0.14),
              borderWidth: 1,
              borderColor: hexAlpha(renderedMood.swatch, 0.28),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              source={renderedMood.image}
              style={{ width: 52, height: 52 }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
          </View>

          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text
              className="text-[11px] tracking-[2.5px] uppercase"
              style={{
                fontFamily: "System",
                fontWeight: "700",
                color: renderedMood.swatch,
              }}
              numberOfLines={1}
            >
              You picked
            </Text>
            <Text
              className="text-ink text-[20px] mt-0.5"
              style={{ fontFamily: "System", fontWeight: "700" }}
              numberOfLines={1}
            >
              {renderedMood.label}
            </Text>
            <Text
              className="text-ink-muted text-[13px] leading-[17px] mt-1"
              style={{ fontFamily: "System", fontWeight: "400" }}
              numberOfLines={2}
            >
              {renderedMood.prompt}.
            </Text>
          </View>

          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Clear selection"
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1, marginLeft: 6 })}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                borderColor: colors.border,
                borderWidth: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M6 6l12 12M18 6L6 18"
                  stroke={colors.inkMuted}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </Pressable>
        </View>

        {/* Primary CTA — swatch-tinted, full width.
            Pressable just owns the tap; the View inside owns the
            box (height/background/etc.). Putting those styles on
            Pressable's style function caused the button to collapse
            on iOS — same pattern as the SelectionBar fix. */}
        <Pressable
          onPress={onConfirm}
          accessibilityRole="button"
          accessibilityLabel="Receive your verse"
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, marginTop: 14 })}
        >
          <View
            style={{
              height: 50,
              borderRadius: 14,
              backgroundColor: renderedMood.swatch,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <Text
              className="text-[14px] tracking-[0.2px]"
              style={{
                fontFamily: "System",
                fontWeight: "700",
                color: pickReadableText(renderedMood.swatch),
              }}
            >
              Receive your verse
            </Text>
            <Svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              style={{ marginLeft: 8 }}
            >
              <Path
                d="M5 12h14M13 5l7 7-7 7"
                stroke={pickReadableText(renderedMood.swatch)}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────
// MoodAtmosphere — full-bleed wash that morphs to the selected mood
// ─────────────────────────────────────────────────────────────────

/**
 * Renders TWO stacked SVG washes:
 *   • A neutral idle wash (very faint white-ink glow) that's
 *     always visible at low opacity — gives the empty-state grid
 *     a tiny bit of "lit space" so the screen never reads as a
 *     flat black canvas.
 *   • An accent wash tinted to the currently-selected mood that
 *     crossfades in when a mood is picked and crossfades out when
 *     the selection is cleared. The accent wash STAYS PAINTED in
 *     the most-recently-selected color during the fade-out so the
 *     transition feels like a dimming light, not a swap to black.
 *
 * Why two layers instead of one re-tinted layer:
 *   SVG doesn't smoothly interpolate `stopColor` across re-renders.
 *   Crossfading via opacity is the reliable way to morph between
 *   two colors without seeing a hard hex swap mid-animation.
 *   We swap the underlying color only AFTER the old wash has
 *   crossfaded out, so each mood lands cleanly on the canvas.
 */
function MoodAtmosphere({ mood }: { mood: Mood | null }) {
  // Buffered color so the wash can keep painting the last-picked
  // mood while the panel is animating out. We only swap to a new
  // color when a NEW mood arrives; clearing the selection just
  // fades the existing color out.
  const [lastMoodColor, setLastMoodColor] = useState<string | null>(null);
  useEffect(() => {
    if (mood) setLastMoodColor(mood.swatch);
  }, [mood]);

  // 0..1 fade for the accent wash. When mood is set → fade IN to
  // 1.0 (full presence); when cleared → fade OUT to 0 (room goes
  // back to bare). The neutral wash is always at 0.10 so the
  // canvas never feels truly empty.
  const accentFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(accentFade, {
      toValue: mood ? 1 : 0,
      duration: mood ? 520 : 380,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [mood, accentFade]);

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 720,
      }}
    >
      {/* Neutral idle wash — barely-there white halo so the
          unpicked state has presence. Sits behind the accent
          wash; never animates, always at constant low opacity. */}
      <Svg width="100%" height="100%" style={{ position: "absolute" }}>
        <Defs>
          <RadialGradient
            id="moodIdleHalo"
            cx="50%"
            cy="28%"
            rx="95%"
            ry="60%"
            fx="50%"
            fy="28%"
          >
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.06} />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.02} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#moodIdleHalo)" />
      </Svg>

      {/* Accent wash — tinted to the chosen mood's swatch. Fades
          in on selection, out on clear. */}
      {lastMoodColor && (
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: accentFade,
          }}
        >
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient
                id="moodAccentHalo"
                cx="50%"
                cy="28%"
                rx="100%"
                ry="65%"
                fx="50%"
                fy="28%"
              >
                <Stop
                  offset="0"
                  stopColor={lastMoodColor}
                  stopOpacity={0.28}
                />
                <Stop
                  offset="0.45"
                  stopColor={lastMoodColor}
                  stopOpacity={0.1}
                />
                <Stop
                  offset="1"
                  stopColor={lastMoodColor}
                  stopOpacity={0}
                />
              </RadialGradient>
            </Defs>
            <Rect
              x={0}
              y={0}
              width="100%"
              height="100%"
              fill="url(#moodAccentHalo)"
            />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Color helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Apply an alpha to a #RRGGBB hex by appending the alpha byte. Cheap
 * inline helper — only used here so it lives next to its consumer.
 */
function hexAlpha(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const hh = Math.round(a * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${hh}`;
}

/**
 * Choose black or near-white text for a given background hex so the
 * button label stays legible regardless of which mood swatch lands
 * underneath it. Uses the relative-luminance threshold from WCAG.
 */
function pickReadableText(hex: string): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  // Perceived luminance (sRGB) — good enough for binary fg choice.
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.6 ? "#111111" : "#FFFFFF";
}
