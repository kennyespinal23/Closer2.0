import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { colors } from "@/constants/theme";
import { progressFor } from "@/constants/onboarding";

/**
 * Each figure is paired with an abstract emotional symbol that
 * echoes their struggle. The icons are intentionally muted so
 * they read as "the weight" against the warm central glow that
 * represents God's nearness.
 */
const FIGURES: {
  name: string;
  felt: string;
  Icon: () => React.ReactElement;
}[] = [
  { name: "Elijah", felt: "felt exhausted.", Icon: FlameIcon },
  { name: "David", felt: "carried shame.", Icon: BrokenHeartIcon },
  { name: "Peter", felt: "failed publicly.", Icon: StormCloudIcon },
  { name: "Thomas", felt: "doubted.", Icon: QuestionIcon },
  { name: "Martha", felt: "felt overwhelmed.", Icon: StackedFormsIcon },
];

export default function ScriptureScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.push("/onboarding/quiet");
  };

  // Pacing
  const DELAYS = {
    headline: 0,
    subtext: 900,
    figureBase: 1800,
    figureGap: 600,
    closing: 1800 + FIGURES.length * 600 + 600, // gap before landing
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingHeader progress={progressFor("scripture")} />

      {/* Soft central light — radial glow representing God's nearness */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 100,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <SoftGlow />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          <FadeIn delayMs={DELAYS.headline}>
            <Text
              className="text-ink text-[26px] leading-[34px] tracking-[-0.4px] mt-6"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              God met people in moments like these before.
            </Text>
          </FadeIn>

          <FadeIn delayMs={DELAYS.subtext}>
            <Text
              className="text-ink-muted text-[15px] leading-[22px] mt-3"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Scripture is full of people who felt what you feel.
            </Text>
          </FadeIn>

          {/* The figures, each with their symbolic icon */}
          <View className="mt-10">
            {FIGURES.map(({ name, felt, Icon }, i) => (
              <FadeIn
                key={name}
                delayMs={DELAYS.figureBase + i * DELAYS.figureGap}
              >
                <View className="flex-row items-center mb-5">
                  <View className="w-7 mr-4 items-center">
                    <Icon />
                  </View>
                  <Text
                    className="text-ink text-[18px] leading-[26px] flex-1 opacity-90"
                    style={{ fontFamily: "PlusJakartaSans_400Regular" }}
                  >
                    <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}>
                      {name}
                    </Text>{" "}
                    {felt}
                  </Text>
                </View>
              </FadeIn>
            ))}
          </View>

          {/* Closing landing — small accent rule above for punctuation */}
          <FadeIn delayMs={DELAYS.closing}>
            <View className="mt-6 items-start">
              <View className="w-8 h-[2px] bg-primary rounded-full mb-4 opacity-80" />
              <Text
                className="text-ink text-[20px] leading-[30px]"
                style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
              >
                Yet God stayed near to every one of them.
              </Text>
            </View>
          </FadeIn>

          <View className="flex-1 min-h-[24px]" />

          <FadeIn delayMs={DELAYS.closing}>
            <View className="pt-6">
              <Button label="Continue" onPress={handleContinue} />
            </View>
          </FadeIn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Soft central light — a true SVG radial gradient. Sits behind the
// content with no pointer events so taps pass through.
// ─────────────────────────────────────────────────────────────────

function SoftGlow() {
  const SIZE = 420;
  return (
    <Svg width={SIZE} height={SIZE} style={{ opacity: 0.55 }}>
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.45} />
          <Stop offset="60%" stopColor={colors.accent} stopOpacity={0.08} />
          <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={SIZE} height={SIZE} fill="url(#glow)" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Figure icons. Stroke-based, muted, ~22px. Each one tries to
// evoke the emotional weight without literalism.
// ─────────────────────────────────────────────────────────────────

const ICON_SIZE = 22;
const STROKE = colors.inkMuted;
const STROKE_W = 1.6;

function FlameIcon() {
  // Elijah — a small flame, slightly bowed (burnout, not absence)
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3c-1 2 1 3 1 5 0 1-1 2-2 2 0-1 0-2-1-3-2 2-4 5-4 8a6 6 0 0012 0c0-3-2-5-3-7-1-2-2-3-3-5z"
        stroke={STROKE}
        strokeWidth={STROKE_W}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BrokenHeartIcon() {
  // David — heart with a jagged crack down the middle
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20s-7-4-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 6-7 10-7 10z"
        stroke={STROKE}
        strokeWidth={STROKE_W}
        strokeLinejoin="round"
      />
      <Path
        d="M12 6.5 10.5 11l3 2-2 4"
        stroke={STROKE}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StormCloudIcon() {
  // Peter — cloud with a small bolt below
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 15a4 4 0 010-8 5 5 0 019.5 1.5A3.5 3.5 0 0117 15H7z"
        stroke={STROKE}
        strokeWidth={STROKE_W}
        strokeLinejoin="round"
      />
      <Path
        d="M12 17l-2 4h3l-1 2"
        stroke={STROKE}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function QuestionIcon() {
  // Thomas — question mark inside a soft circle
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke={STROKE} strokeWidth={STROKE_W} />
      <Path
        d="M9.2 9.5a2.8 2.8 0 015.6 0c0 1.7-2.8 2.2-2.8 4"
        stroke={STROKE}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
      />
      <Circle cx={12} cy={17} r={0.9} fill={STROKE} />
    </Svg>
  );
}

function StackedFormsIcon() {
  // Martha — three stacked bars, suggesting things piling up
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Rect
        x={5}
        y={6}
        width={14}
        height={3}
        rx={1.5}
        stroke={STROKE}
        strokeWidth={STROKE_W}
      />
      <Rect
        x={3}
        y={11}
        width={18}
        height={3}
        rx={1.5}
        stroke={STROKE}
        strokeWidth={STROKE_W}
      />
      <Rect
        x={7}
        y={16}
        width={10}
        height={3}
        rx={1.5}
        stroke={STROKE}
        strokeWidth={STROKE_W}
      />
    </Svg>
  );
}
