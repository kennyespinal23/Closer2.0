import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { BrandGlyph } from "@/components/BrandGlyph";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { useOnboarding } from "@/state/onboarding";

/**
 * Screen 2 — Multi-select grid: "Which apps do you open first
 * thing in the morning?"
 *
 * Two reasons this screen matters:
 *
 *   1. Personalization for Screen 6. The names the user picks here
 *      get NAMED back at them on the gut-punch screen ("You're
 *      opening Instagram & TikTok 730 times before God this year").
 *      Without inputs the punch is generic; with inputs it's a
 *      mirror.
 *
 *   2. Implicit confession. Picking the apps is a small "yeah, I
 *      know" moment. By the time the user finishes this screen
 *      they've already conceded the premise.
 *
 * UX in this premium pass:
 *   • Pill-card rows (one per app) instead of a wrapped chip grid.
 *     The chips were text-only and read as bland — switching to a
 *     full-width row with a BrandGlyph leading icon makes each
 *     option recognizable from across the screen, and turns the
 *     "yeah, I know" into a moment of visual identification
 *     ("oh — yeah, that's me opening Instagram first").
 *   • Selection uses iOS-blue (colors.select / selectSoft) with a
 *     checkmark glyph on the right. White-on-white was the old
 *     accent, which made selected and unselected look identical
 *     against the bg.
 *   • "News" and "Other" don't have brand glyphs — they get
 *     generic mark icons (newspaper / dots) styled in the same
 *     chip vocabulary so the layout stays uniform.
 */

type AppOption = {
  id: string;
  label: string;
  /** Display name used when listing the apps back on Screen 6 ("Instagram & TikTok"). */
  punchName: string | null;
  /** If null, render a generic glyph instead of a BrandGlyph. */
  brandId: string | null;
};

const APP_OPTIONS: ReadonlyArray<AppOption> = [
  { id: "instagram", label: "Instagram", punchName: "Instagram", brandId: "instagram" },
  { id: "tiktok", label: "TikTok", punchName: "TikTok", brandId: "tiktok" },
  { id: "x", label: "Twitter / X", punchName: "X", brandId: "x" },
  { id: "youtube", label: "YouTube", punchName: "YouTube", brandId: "youtube" },
  { id: "facebook", label: "Facebook", punchName: "Facebook", brandId: "facebook" },
  { id: "snapchat", label: "Snapchat", punchName: "Snapchat", brandId: "snapchat" },
  { id: "reddit", label: "Reddit", punchName: "Reddit", brandId: "reddit" },
  { id: "news", label: "News apps", punchName: "the news", brandId: null },
  // "Other" doesn't get named back to the user — we don't want
  // to invent a label they didn't pick. It still counts toward
  // the morning-apps tally so the punch math stays honest.
  { id: "other", label: "Other", punchName: null, brandId: null },
];

export default function AppsScreen() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboarding();

  const [selected, setSelected] = useState<string[]>(
    answers.morningApps ?? [],
  );

  const canContinue = selected.length > 0;

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleContinue = () => {
    if (!canContinue) return;
    setAnswer("morningApps", selected);
    router.push("/onboarding/proof");
  };

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <OnboardingChrome mode="back-only" />

      <ScrollView
        // Bottom padding leaves room for the sticky Continue bar
        // so the last app row isn't ever flush against the
        // button's top edge.
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6">
          <FadeIn delayMs={0}>
            <Text
              className="text-ink text-[26px] leading-[34px] tracking-[-0.4px] mt-4"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              Which apps do you open{"\n"}first thing in the morning?
            </Text>
          </FadeIn>

          <FadeIn delayMs={500}>
            <Text
              className="text-ink-muted text-[15px] leading-[22px] mt-3"
              style={{ fontFamily: "System", fontWeight: "400" }}
            >
              Pick all that apply.
            </Text>
          </FadeIn>

          <FadeIn delayMs={900}>
            <View className="mt-7" style={{ gap: 10 }}>
              {APP_OPTIONS.map((opt) => (
                <AppRow
                  key={opt.id}
                  label={opt.label}
                  brandId={opt.brandId}
                  selected={selected.includes(opt.id)}
                  onPress={() => toggle(opt.id)}
                />
              ))}
            </View>
          </FadeIn>
        </View>
      </ScrollView>

      {/* Sticky Continue bar — lives OUTSIDE the ScrollView so the
          CTA is always reachable, even when the option list runs
          past the fold on smaller phones. (Previously the button
          sat at the bottom of the scroll content and could slip
          below the viewport, which made users think the screen
          had no advance affordance once they'd picked apps.) */}
      <View className="px-6 pt-3 pb-2 bg-bg">
        <Button
          label="Continue"
          onPress={handleContinue}
          disabled={!canContinue}
        />
      </View>
    </SafeAreaView>
  );
}

/**
 * A single app row in the picker. Full-width pill-card with a
 * leading BrandGlyph (or generic icon for non-branded options),
 * an app label, and a trailing checkmark when selected.
 *
 * Selection visual:
 *   • Unselected: surface bg, hairline border
 *   • Selected:   selectSoft bg (iOS-blue tinted), select border,
 *                 iOS-blue check icon on the right
 *
 * The brand glyph stays in its own color regardless of selection
 * — its job is recognition, not status indication. The select
 * accent on the chip's border + bg carries the "I picked this"
 * meaning.
 */
function AppRow({
  label,
  brandId,
  selected,
  onPress,
}: {
  label: string;
  brandId: string | null;
  selected: boolean;
  onPress: () => void;
}) {
  // IMPORTANT: chrome MUST be NativeWind classes, not Pressable
  // function-style. RN 0.81's Pressable on iOS silently ignores
  // function-form `style={({pressed}) => ...}` for chrome props
  // (flexDirection / padding / border / bg), producing rows that
  // look like floating labels with no card around them. The whole
  // rest of the app uses className tokens for the same reason —
  // see comments in TimeCard / studytime TimeCard. Same protection
  // applies here.
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      className={[
        "flex-row items-center rounded-2xl py-3 px-3.5 border-2 active:opacity-85",
        selected
          ? "bg-select-soft border-select"
          : "bg-surface border-border",
      ].join(" ")}
    >
      {brandId ? (
        <BrandGlyph appId={brandId} size="md" />
      ) : (
        <GenericGlyph kind={label.toLowerCase().includes("news") ? "news" : "other"} />
      )}
      <Text
        className="ml-3 flex-1 text-ink"
        style={{
          fontFamily: "System",
          fontWeight: "600",
          fontSize: 16,
          letterSpacing: -0.1,
        }}
      >
        {label}
      </Text>
      {selected ? (
        <View className="w-6 h-6 rounded-full items-center justify-center bg-select">
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 12.5l4.5 4.5L19 7"
              stroke="#FFFFFF"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      ) : (
        // Empty placeholder so unselected rows have the same
        // trailing inset as selected ones — prevents the label
        // from jumping horizontally as the user taps.
        <View className="w-6 h-6" />
      )}
    </Pressable>
  );
}

/**
 * Generic glyph for non-branded options ("News apps", "Other").
 * Renders in the same 40pt chip footprint as a BrandGlyph so the
 * row layout stays uniform regardless of which option type it is.
 *
 * News = newspaper outline.
 * Other = three horizontal dots.
 *
 * Both use a neutral graphite chip bg so they don't compete with
 * the branded chips' saturated colors.
 */
function GenericGlyph({ kind }: { kind: "news" | "other" }) {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "#3A3A3D",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {kind === "news" ? (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 6h16v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6z"
            stroke="#FFFFFF"
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
          <Path
            d="M7 10h6M7 13h6M7 16h4M15 10h2v2h-2zM15 14h2v2h-2z"
            stroke="#FFFFFF"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : (
        // Three dots — explicit circles. The earlier attempt used a
        // path of `M6 12 M12 12 M18 12` with strokeLinecap=round
        // hoping a 0-length stroke would render as a dot. It didn't
        // — SVG dropped the moves with no draw command and the
        // chip rendered empty (a flat gray square). Circles are
        // unambiguous and reliable.
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
            fill="#FFFFFF"
          />
          <Path
            d="M10.5 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
            fill="#FFFFFF"
          />
          <Path
            d="M16 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
            fill="#FFFFFF"
          />
        </Svg>
      )}
    </View>
  );
}
