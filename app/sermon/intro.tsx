import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { SermonHeader } from "@/components/SermonHeader";
import { TODAYS_SERMON } from "@/constants/sermon";
import { getTodaysSermonType } from "@/constants/sermonTypes";

/**
 * Sermon intro — the antechamber.
 *
 * Layout (top → bottom):
 *   1. Type label  ("Daily Church · 12 min")
 *   2. Hero image  (the sermon type's icon, centered, with an accent glow)
 *   3. Title       (the specific sermon for today)
 *   4. Description (longer copy explaining what this type of sermon is)
 *   5. Start Reading button + grounding microcopy
 *
 * No progress bar — the sermon hasn't begun yet. The job here is to let
 * the user know what kind of sermon they're stepping into and take a
 * breath before they tap Start Reading.
 */
export default function SermonIntroScreen() {
  const router = useRouter();
  const type = getTodaysSermonType();

  const handleStart = () => {
    router.push("/sermon/scripture");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <SermonHeader />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 items-center">
          {/* Eyebrow — which type of sermon today is */}
          <FadeIn delayMs={0} durationMs={800}>
            <View className="flex-row items-center mt-2 mb-1">
              <View
                className="w-6 h-[1.5px] rounded-full mr-3"
                style={{ backgroundColor: type.accent }}
              />
              <Text
                className="text-[10px] tracking-[3px] uppercase"
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: type.accent,
                }}
              >
                Today · {type.name}
              </Text>
              <View
                className="w-6 h-[1.5px] rounded-full ml-3"
                style={{ backgroundColor: type.accent }}
              />
            </View>
          </FadeIn>

          {/* Hero — type icon with an accent-colored ambient glow behind it */}
          <FadeIn delayMs={250} durationMs={1100}>
            <View className="items-center justify-center mt-8 mb-2">
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  width: 360,
                  height: 360,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AccentGlow color={type.accent} />
              </View>

              <Image
                source={type.hero}
                style={{ width: 240, height: 200 }}
                resizeMode="contain"
                accessibilityLabel={`${type.name} hero illustration`}
              />
            </View>
          </FadeIn>

          {/* Tagline — the short voice line from the design plate */}
          <FadeIn delayMs={750} durationMs={1000}>
            <Text
              className="text-ink-muted text-[14px] mt-4 italic"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              "{type.tagline}"
            </Text>
          </FadeIn>

          {/* Title of today's specific sermon */}
          <FadeIn delayMs={1100} durationMs={1000}>
            <Text
              className="text-ink text-[28px] leading-[34px] tracking-[-0.4px] text-center mt-7 px-2"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              {TODAYS_SERMON.title}
            </Text>
          </FadeIn>

          {/* Description of what this *type* of sermon is */}
          <FadeIn delayMs={1500} durationMs={1100}>
            <Text
              className="text-ink-muted text-[15px] leading-[24px] text-center mt-4 px-4"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              {type.description}
            </Text>
          </FadeIn>

          {/* Meta — pastor + duration */}
          <FadeIn delayMs={1900} durationMs={900}>
            <View className="flex-row items-center mt-7">
              <View
                className="w-1.5 h-1.5 rounded-full mr-2"
                style={{ backgroundColor: type.accent }}
              />
              <Text
                className="text-ink-subtle text-[12px] tracking-[1.5px] uppercase"
                style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
              >
                {TODAYS_SERMON.pastor} · {TODAYS_SERMON.durationMin} min
              </Text>
            </View>
          </FadeIn>
        </View>
      </ScrollView>

      {/* Start CTA — fixed at bottom */}
      <FadeIn delayMs={2300} durationMs={900}>
        <View className="px-6 pb-2 pt-2">
          <Button label="Start Reading" onPress={handleStart} />
          <Text
            className="text-ink-subtle text-[12px] text-center mt-3"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            Take a breath. There's no rush.
          </Text>
        </View>
      </FadeIn>
    </SafeAreaView>
  );
}

/**
 * Soft circular halo behind the hero, tinted to match the sermon type.
 * Same warm-glow language as the rest of the app, but the color
 * varies per type — Daily Church glows orange, Prayer Nights glows
 * deep blue, Testimonies glows green, etc.
 */
function AccentGlow({ color }: { color: string }) {
  return (
    <Svg width={360} height={360} viewBox="0 0 360 360">
      <Defs>
        <RadialGradient id="accentGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <Stop offset="50%" stopColor={color} stopOpacity={0.08} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={360} height={360} fill="url(#accentGlow)" />
    </Svg>
  );
}
