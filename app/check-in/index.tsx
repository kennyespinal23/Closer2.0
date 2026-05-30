import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { FadeIn } from "@/components/FadeIn";
import { MOODS } from "@/constants/moods";
import { colors } from "@/constants/theme";

/**
 * Step 1 of the check-in: "How are you?"
 *
 * Renders the 12-mood catalog as a 3-column grid. Each card is a
 * soft-bordered tile with a colored glyph + the mood name + a
 * one-line prompt. Tapping a card pushes to the verse-delivery
 * screen with the mood id as a param; the next screen handles
 * recording the check-in and rendering the verse.
 *
 * The screen is intentionally calm — no progress dots, no urgency.
 * Picking a mood IS the action; there is no "Next" button.
 */
export default function MoodSelectScreen() {
  const router = useRouter();

  const handlePick = (moodId: string) => {
    router.push(`/check-in/${moodId}` as never);
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top bar — Close button only ─────────────────── */}
        <View className="px-6 pt-2 flex-row items-center justify-between">
          <Text
            className="text-ink-subtle text-[11px] tracking-[3px] uppercase"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
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
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              How are you,{"\n"}really?
            </Text>
            <Text
              className="text-ink-muted text-[14px] leading-[20px] mt-3"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Pick what's closest. A verse will meet you where you are.
            </Text>
          </View>
        </FadeIn>

        {/* ─── Mood grid ───────────────────────────────────── */}
        <FadeIn delayMs={200} durationMs={900}>
          <View className="px-6 mt-8 flex-row flex-wrap" style={{ gap: 10 }}>
            {MOODS.map((mood, i) => (
              <MoodCard
                key={mood.id}
                label={mood.label}
                prompt={mood.prompt}
                swatch={mood.swatch}
                glyph={mood.glyph}
                delayMs={250 + i * 30}
                onPress={() => handlePick(mood.id)}
              />
            ))}
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// MoodCard — single tile in the 3-column grid
// ─────────────────────────────────────────────────────────────────

function MoodCard({
  label,
  prompt,
  swatch,
  glyph,
  delayMs,
  onPress,
}: {
  label: string;
  prompt: string;
  swatch: string;
  glyph: string;
  delayMs: number;
  onPress: () => void;
}) {
  return (
    <FadeIn delayMs={delayMs} durationMs={700}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`I'm feeling ${label.toLowerCase()}`}
        // Width math: 3 columns, 10px gap, 24px outer padding each side.
        // ((screenWidth - 48 padding - 20 gaps) / 3). Use percentages so
        // it scales across device widths without hardcoding pixels.
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : 1,
          width: "31.6%",
        })}
        className="rounded-2xl border border-border bg-surface px-3 py-4 items-center"
      >
        <View
          className="w-9 h-9 rounded-full items-center justify-center mb-2"
          style={{
            backgroundColor: hexAlpha(swatch, 0.12),
            borderWidth: 1,
            borderColor: hexAlpha(swatch, 0.32),
          }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 16,
              color: swatch,
            }}
          >
            {glyph}
          </Text>
        </View>
        <Text
          className="text-ink text-[13px]"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text
          className="text-ink-subtle text-[10.5px] mt-0.5 text-center leading-[14px]"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          numberOfLines={2}
        >
          {prompt}
        </Text>
      </Pressable>
    </FadeIn>
  );
}

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
