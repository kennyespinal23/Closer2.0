import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FocusBanner } from "@/components/FocusBanner";
import { SermonHeader } from "@/components/SermonHeader";
import {
  SERMON_STEPS,
  sermonProgressFor,
  sermonStepNumber,
  stepForPanelId,
} from "@/constants/sermon";
import * as haptics from "@/lib/haptics";
import { resolveSermonType } from "@/lib/moments";
import { useMoments } from "@/state/moments";
import { useProgress } from "@/state/progress";

/**
 * Sermon panel renderer — a single dynamic route that handles all
 * five in-sermon beats (Hook → Story → Turn → Landing → Prayer).
 *
 * URL: /sermon/panel/[id] where `id` is 1..5, matching the panel's
 * own `id` field in `assets/data/sermons.js`. The earlier flow had
 * five near-identical screen files; collapsing into one route
 * means tuning the layout (typography, animation, spacing) happens
 * in one place instead of five.
 *
 * The prayer panel (always `id: 5`, flagged `isPrayer: true` in
 * the data) gets a distinct atmospheric blue treatment — softer
 * glow, italic copy, "Amen" CTA, and the completion record on tap.
 * Every other panel uses the per-sermon-type accent and a
 * "Continue" CTA that pushes to the next panel id.
 *
 * Navigation:
 *   • Panels 1–4 push to `/sermon/panel/${id + 1}`
 *   • Panel  5  (prayer) records the completion and replaces into
 *     `/sermon/complete` — same chain the old prayer.tsx wired.
 *
 * The body field can contain blank-line paragraph breaks (`\n\n`)
 * that we split on so multi-paragraph beats read with breathing
 * room between them — without forcing the content team to use a
 * markdown layer.
 */
export default function SermonPanelScreen() {
  const router = useRouter();
  const { todaysMoment } = useMoments();
  const { recordCompletion } = useProgress();
  const type = resolveSermonType(todaysMoment.type);

  // Pull the panel id out of the URL segment. Coerce + guard so a
  // hot-reload glitch or a deep link with garbage doesn't crash
  // the screen — we fall back to panel 1 ("The Hook") which is
  // always safe to render.
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const panelId = clampPanelId(Number(idParam));
  const panel =
    todaysMoment.panels.find((p) => p.id === panelId) ??
    todaysMoment.panels[0]!;

  const isLastPanel = panelId === SERMON_STEPS.length;
  const isPrayer = panel.isPrayer === true;

  // Map the panel id to the canonical step name so we can drive
  // the SermonHeader progress bar from the same source of truth
  // every other screen uses (constants/sermon.ts).
  const stepName = stepForPanelId(panelId) ?? SERMON_STEPS[0]!;

  // Split on blank lines so a body authored with multiple
  // paragraphs renders with breathing room between them. Single
  // paragraphs come through as a one-element array.
  const paragraphs = useMemo(
    () =>
      panel.body
        .split(/\n{2,}/)
        .map((s) => s.trim())
        .filter(Boolean),
    [panel.body],
  );

  // Prayer panels get an atmospheric blue palette regardless of
  // the sermon type's accent — a visual "you've arrived at the
  // closing breath of the sermon" cue. Every other panel uses the
  // per-type accent so the whole flow reads of-a-piece.
  const accent = isPrayer ? PRAYER_BLUE : type.accent;

  const handleContinue = () => {
    // Continue advances the sermon; Amen on the prayer panel
    // celebrates completion. Both deserve haptic confirmation —
    // success notification on the final Amen (it's a celebration),
    // medium tap on Continue (committed forward step).
    if (isPrayer && isLastPanel) {
      haptics.success();
    } else {
      haptics.tap();
    }
    if (!isLastPanel) {
      router.push(`/sermon/panel/${panelId + 1}` as const);
      return;
    }

    // Last panel — record the completion and chain into the
    // celebration screen, exactly as the old prayer.tsx did. The
    // moment's title goes onto the Journey timeline and the
    // moment's `voice` carries through as the pastor attribution
    // so the timeline card has a real name to display.
    const {
      typeCount,
      isFirstEver,
      newStreak,
      streakAdvanced,
      crossedMilestone,
    } = recordCompletion(type.id, {
      title: todaysMoment.title,
      pastor: todaysMoment.voice,
    });
    router.replace({
      pathname: "/sermon/complete",
      params: {
        typeCount: String(typeCount),
        isFirstEver: String(isFirstEver),
        streak: String(newStreak),
        streakAdvanced: streakAdvanced ? "1" : "0",
        milestone: crossedMilestone ? String(crossedMilestone) : "",
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <SermonHeader
        progress={sermonProgressFor(stepName)}
        step={sermonStepNumber(stepName)}
      />

      {/* Focus banner — renders nothing when no focus session is
          active, so it's safe to mount unconditionally. When a
          session IS active, the slim pill sits just below the
          progress bar so the user has a constant reminder + an
          escape hatch ("End") on every panel. */}
      <FocusBanner />

      {/* Soft ambient glow tinted to the active accent. The prayer
          panel anchors the glow higher and slightly larger — like
          a dawn light entering from above — while the narrative
          panels anchor a quieter mid-screen halo. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: isPrayer ? 60 : 200,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        {isPrayer ? (
          <DawnGlow color={accent} />
        ) : (
          <PanelGlow color={accent} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 24,
          // Prayer is meant to be received — vertically centered so
          // the words settle in the middle of the screen, not at
          // the top. Narrative panels start at the top so the
          // reader scans naturally downward through the long copy.
          justifyContent: isPrayer ? "center" : "flex-start",
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-4">
          {/* ─── Eyebrow ────────────────────────────────────────
              The panel's `label` from the data ("The Hook", "The
              Story", "Prayer") drives the eyebrow text. Prayers
              get the dual-bookend treatment to feel ceremonial;
              everything else uses a single leading bar so the
              reader's eye moves into the body. */}
          {isPrayer ? (
            <View className="flex-row items-center justify-center mb-7">
              <View
                className="w-6 h-[1.5px] rounded-full mr-3"
                style={{ backgroundColor: accent }}
              />
              <Text
                className="text-[10px] tracking-[3px] uppercase"
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: accent,
                }}
              >
                {panel.label}
              </Text>
              <View
                className="w-6 h-[1.5px] rounded-full ml-3"
                style={{ backgroundColor: accent }}
              />
            </View>
          ) : (
            <Text
              className="text-[10px] tracking-[3px] uppercase"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: accent,
              }}
            >
              {panel.label}
            </Text>
          )}

          {/* ─── Big quiet numeral ──────────────────────────────
              Anchored to the panel's position in the sequence.
              "01" .. "05" — zero-padded so the visual rhythm is
              consistent across all five panels. Hidden on the
              prayer panel because that panel's design rhythm is
              dual-bookend → centered prayer body → Amen; a big
              numeral on the side breaks that. */}
          {!isPrayer && (
            <Text
              className="text-[64px] leading-[64px] mt-2 opacity-30"
              style={{
                fontFamily: "PlusJakartaSans_800ExtraBold",
                color: accent,
              }}
            >
              {String(panelId).padStart(2, "0")}
            </Text>
          )}

          {/* ─── Sermon title (narrative panels only) ───────────
              Hook / Story / Turn / Landing each anchor on the
              sermon's title so the reader has a constant North
              Star as they move through the long bodies. The prayer
              panel's content speaks for itself — no title needed. */}
          {!isPrayer && (
            <Text
              className="text-ink text-[26px] leading-[34px] tracking-[-0.4px] mt-3"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              {todaysMoment.title}
            </Text>
          )}

          {/* ─── Body ──────────────────────────────────────────
              SERMON PROSE in EB Garamond — the single most
              impactful typographic move in the app. Sermon body
              is editorial / sacred text and deserves the same
              literary serif treatment a printed devotional or a
              study Bible would give it. Sans-serif sermon bodies
              read as content management; serif sermon bodies
              read as printed page.

              Treatment varies by panel:
                • NARRATIVE panels (Hook / Story / Turn / Landing)
                  use EB Garamond Regular at 19/30. Slightly bigger
                  than the previous 17/28 because serif reads
                  smaller optically than sans at the same point
                  size. Letter-spacing nudged positive (0.1) — serif
                  letters don't want the negative tracking sans
                  needs to look tight.
                • PRAYER panel uses EB Garamond Italic at 21/32 with
                  text-align center. Italic Garamond is one of the
                  most beautiful display italics ever cut; using it
                  for the prayer makes the closing breath of the
                  sermon feel hand-set rather than rendered.

              Eyebrow, title, and "Amen" tracked-caps all stay in
              Plus Jakarta Sans — they're navigation chrome and
              landmarks, not editorial copy. The split between
              "what's UI" (sans) and "what's text" (serif) is the
              whole reason the pairing works. */}
          <View className={isPrayer ? "mt-2" : "mt-7"}>
            {paragraphs.map((p, i) =>
              isPrayer ? (
                <Text
                  key={i}
                  className="text-ink text-[21px] leading-[32px] text-center mb-5"
                  style={{
                    fontFamily: "EBGaramond_400Regular_Italic",
                    letterSpacing: 0.1,
                  }}
                >
                  {p}
                </Text>
              ) : (
                <Text
                  key={i}
                  className="text-ink text-[19px] leading-[30px] mb-5"
                  style={{
                    fontFamily: "EBGaramond_400Regular",
                    letterSpacing: 0.1,
                  }}
                >
                  {p}
                </Text>
              ),
            )}
          </View>

          {/* ─── Prayer-only Amen mark ─────────────────────────
              Renders a tracked-uppercase "Amen" in the accent
              color below the prayer body, mirroring the old
              prayer screen's three-beat closing (body → italic
              closer → Amen mark). The CTA below the scrollview
              also reads "Amen", but the in-page mark is the
              ceremonial cue — the button is the action. */}
          {isPrayer && (
            <Text
              className="text-[18px] text-center mt-3 tracking-[6px] uppercase"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: accent,
              }}
            >
              Amen
            </Text>
          )}
        </View>
      </ScrollView>

      <View className="px-6 pb-2">
        <Button
          label={isPrayer ? "Amen" : "Continue"}
          onPress={handleContinue}
        />
        {isPrayer && (
          <Text
            className="text-ink-subtle text-[12px] text-center mt-3"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            You showed up today. That counts.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Constants + helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Atmospheric blue used for the prayer panel. Same family as the
 * "drawing near" accent on the home reading-goal ring (iOS system
 * blue, dark variant) so the closing breath of the sermon shares
 * visual DNA with the calm "you're making progress" cue on the
 * home screen. The narrative panels keep their per-sermon-type
 * accents — only the prayer panel commits to blue.
 */
const PRAYER_BLUE = "#0A84FF";

/**
 * Clamp an arbitrary number to a valid panel id (1..5). Anything
 * else (NaN, negative, > 5) collapses to 1 so the screen always
 * has a real panel to render.
 */
function clampPanelId(raw: number): number {
  if (!Number.isFinite(raw)) return 1;
  const int = Math.floor(raw);
  if (int < 1) return 1;
  if (int > SERMON_STEPS.length) return SERMON_STEPS.length;
  return int;
}

// ─────────────────────────────────────────────────────────────────
// Glow art — two variations
// ─────────────────────────────────────────────────────────────────

/** Centered ambient halo behind narrative panels. */
function PanelGlow({ color }: { color: string }) {
  return (
    <Svg width={420} height={420} viewBox="0 0 420 420">
      <Defs>
        <RadialGradient id="panelGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <Stop offset="60%" stopColor={color} stopOpacity={0.05} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={420} height={420} fill="url(#panelGlow)" />
    </Svg>
  );
}

/** Top-anchored dawn glow behind the prayer panel — light from above. */
function DawnGlow({ color }: { color: string }) {
  return (
    <Svg width={480} height={360} viewBox="0 0 480 360">
      <Defs>
        <RadialGradient id="dawn" cx="50%" cy="20%" r="80%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <Stop offset="40%" stopColor={color} stopOpacity={0.09} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={480} height={360} fill="url(#dawn)" />
    </Svg>
  );
}
