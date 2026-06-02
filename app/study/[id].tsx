import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { summarizeBlockedApps } from "@/lib/focus";
import { formatReminderTime } from "@/lib/notifications";
import { useFocus } from "@/state/focus";
import {
  formatDaysOfWeek,
  useStudySessions,
} from "@/state/studySessions";
import { useColors } from "@/state/theme";

/**
 * Bible-study landing — the entry point a scheduled study notification
 * deep-links into.
 *
 * This screen plays the same role for study sessions that
 * `/sermon/intro` plays for the daily sermon: it's the antechamber
 * where the user takes a breath, confirms the commitment, and starts
 * the focused reading block by tapping a single big "Begin reading"
 * button. The notification arrived at the time the user themselves
 * scheduled, so the tone is "the moment you set aside is here" —
 * not "you have to do this."
 *
 * What happens when the user taps Begin:
 *   1. We start a focus session (lib/focus → shieldStart). Phase 1
 *      this is an honor-mode commitment; Phase 2 will trigger the
 *      real OS-level shield once the entitlement lands.
 *   2. We navigate to the Library tab. The user picks their place
 *      (or jumps into their last-read chapter via Continue Reading)
 *      and starts reading. The global focus banner takes over from
 *      there — it floats over every screen until the session ends.
 *
 * What happens if the session was deleted between scheduling and
 * tap-time (rare but possible — user edits sessions, an old
 * notification fires):
 *   • The session lookup returns undefined and we render a small
 *     "session unavailable" state with a single button back to
 *     home. No crash, no confusing empty UI.
 */
export default function StudyLandingScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSession } = useStudySessions();
  const { prefs: focusPrefs, startSession: startFocusSession } = useFocus();

  // Defensive lookup — id can be undefined briefly during router
  // mount (cold-start deep link), so we treat any falsy value as
  // "still resolving" and show the unavailable state only when we
  // have a concrete id that doesn't match anything in storage.
  const session = typeof id === "string" ? getSession(id) : undefined;

  // Per-visit override — same model as sermon intro. The user can
  // skip focus for THIS session without changing their standing
  // preference. Reset when they leave the screen.
  const [skipFocusOnce, setSkipFocusOnce] = useState(false);

  // The app list this routine will silence — its OWN per-session
  // list, NOT the user's global focus prefs. A routine can carry
  // its own curated subset (e.g. morning study silences feeds only;
  // evening study silences feeds + Messages). Falls back to the
  // global prefs if the session somehow loaded without a list
  // (older saves, hand-edited storage, etc.).
  const sessionApps =
    session && session.blockedAppIds.length > 0
      ? session.blockedAppIds
      : focusPrefs.blockedAppIds;

  // Focus engages only when ALL of these are true:
  //   • Global focus master is ON (focusPrefs.enabled). This is what
  //     the home screen's Focus-mode pill toggles. Gating on it here
  //     means the home pill and the per-session "FOCUS ON" badge on
  //     the Practice tab stay in lockstep with the actual runtime
  //     behavior — if the user toggles focus off globally, NO
  //     session triggers focus, even ones with the per-session
  //     opt-in still on. (They'll show "FOCUS PAUSED" until the
  //     master flips back on.)
  //   • This routine opted in via `session.useFocusMode`. Sessions
  //     that DIDN'T opt in are pure reminders — Begin opens the
  //     Library without touching focus.
  //   • The routine has at least one app to silence. An empty list
  //     would just be theater.
  //   • The user hasn't tapped Skip on this visit.
  const focusOffered =
    focusPrefs.enabled &&
    Boolean(session?.useFocusMode) &&
    sessionApps.length > 0 &&
    !skipFocusOnce;

  const showFocusRow = focusOffered && !focusPrefs.autoStart;

  const handleBegin = async () => {
    if (focusOffered && session) {
      // Start the focus session BEFORE navigating so the banner is
      // armed on Library's first render. Pass the routine's own
      // blocked-app list so this session silences exactly what
      // the user configured for this routine — not whatever their
      // global focus prefs happen to be set to right now.
      //
      // We also pass `session.id` so the focus state remembers
      // which routine launched it — the home pill reads that back
      // and shows "Focus mode active · Morning Study" instead of
      // a generic app count, which is what the user expects when
      // a routine is the thing driving focus.
      //
      // sermonDay is 0 because study sessions aren't sermon-scoped
      // (the field on FocusSession is a back-compat scalar used
      // by analytics).
      await startFocusSession(0, {
        customBlockedAppIds: sessionApps,
        routineId: session.id,
        // Propagate the routine's chosen length into the focus
        // session so the mini-player and Now card render a
        // countdown + progress bar for time-boxed routines.
        // Legacy routines without a durationMinutes leave this
        // undefined and the focus session runs open-ended (the
        // pre-Phase-C behavior).
        ...(typeof session.durationMinutes === "number" &&
        session.durationMinutes > 0
          ? { durationMs: session.durationMinutes * 60_000 }
          : {}),
      });
    }
    // Two-phase nav, same pattern as the check-in modal flow:
    //   • The landing screen is presented as a `modal` in the root
    //     stack. Calling `router.replace` from inside the modal
    //     would route INSIDE the modal stack — not back out to the
    //     tabs — so the user would never actually leave this
    //     screen. We have to dismissAll() to tear the modal down,
    //     then push the destination on the parent (tabs) stack.
    //   • dismissAll + push fired in the same tick race each other;
    //     the dismiss can tear down the routing context the push
    //     relies on, silently dropping the push. The setTimeout(0)
    //     defers the push to the next event-loop tick so the
    //     dismiss settles first.
    router.dismissAll();
    setTimeout(() => {
      router.push("/(tabs)/library" as never);
    }, 0);
  };

  const handleDismiss = () => {
    // Tear down the modal back to whatever the user had open before
    // the notification fired. dismissAll handles cold-start too:
    // when there's no real back-stack (notification tap from a
    // killed app), it just resolves to the root tab.
    router.dismissAll();
  };

  // ─── Empty state — session not found ────────────────────────────
  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        <Header onDismiss={handleDismiss} />
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-5"
            style={{ backgroundColor: colors.surface }}
          >
            <BookGlyph stroke={colors.inkMuted} />
          </View>
          <Text
            className="text-ink text-[20px] leading-[26px] text-center"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            This study isn&apos;t scheduled anymore
          </Text>
          <Text
            className="text-ink-muted text-[14px] leading-[21px] text-center mt-2.5 px-2"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          >
            You can set up a new one anytime from your profile, under
            Study sessions.
          </Text>
          <View className="w-full mt-7">
            <Button label="Go to home" onPress={handleDismiss} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Resolved session — the real landing ────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <Header onDismiss={handleDismiss} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 items-center">
          {/* Eyebrow — "Today · Bible Study" anchor */}
          <View className="flex-row items-center mt-2 mb-1">
            <View
              className="w-6 h-[1.5px] rounded-full mr-3"
              style={{ backgroundColor: STUDY_ACCENT }}
            />
            <Text
              className="text-[10px] tracking-[3px] uppercase"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: STUDY_ACCENT,
              }}
            >
              Now · Bible Study
            </Text>
            <View
              className="w-6 h-[1.5px] rounded-full ml-3"
              style={{ backgroundColor: STUDY_ACCENT }}
            />
          </View>

          {/* Hero — soft book illustration with accent glow */}
          <View className="items-center justify-center mt-6 mb-2">
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 320,
                height: 320,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AccentGlow color={STUDY_ACCENT} />
            </View>

            <View
              className="w-[140px] h-[140px] rounded-[40px] items-center justify-center"
              style={{
                backgroundColor: withAlpha(STUDY_ACCENT, 0.12),
                borderWidth: 1,
                borderColor: withAlpha(STUDY_ACCENT, 0.25),
              }}
            >
              <BookGlyph stroke={STUDY_ACCENT} size={68} />
            </View>
          </View>

          {/* Session name */}
          <Text
            className="text-ink text-[28px] leading-[34px] tracking-[-0.4px] text-center mt-7 px-2"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            {session.name || "Bible study"}
          </Text>

          {/* Time + days subtitle */}
          <Text
            className="text-ink-muted text-[13px] mt-3"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            {formatReminderTime(session.time)}
            {"  ·  "}
            {formatDaysOfWeek(session.daysOfWeek)}
          </Text>

          {/* Framing copy */}
          <Text
            className="text-ink-subtle text-[14px] leading-[22px] text-center mt-7 px-3"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          >
            The time you set aside is here. Open your Bible, pick a
            place, and stay there for a few minutes.
          </Text>
        </View>
      </ScrollView>

      {/* CTA group — pinned at bottom, mirrors sermon intro layout */}
      <View className="px-6 pb-2 pt-2">
        {showFocusRow && (
          <FocusRow
            apps={sessionApps}
            onSkip={() => setSkipFocusOnce(true)}
          />
        )}
        <Button label="Begin reading" onPress={handleBegin} />
        <View className="mt-2.5">
          <Button
            label="Not right now"
            variant="ghost"
            onPress={handleDismiss}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Header — minimal "close" affordance
//
// Plain X in the top-right (no title) — the body of the screen IS
// the title, and a duplicate header would just push the hero down
// without adding information. The X uses replace-to-home rather
// than back() so cold-start cases land somewhere sensible instead
// of trying to pop an empty stack.
// ─────────────────────────────────────────────────────────────────

function Header({ onDismiss }: { onDismiss: () => void }) {
  const colors = useColors();
  return (
    <View className="flex-row items-center justify-end px-4 pt-2 pb-1">
      <Pressable
        onPress={onDismiss}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close"
        className="w-10 h-10 rounded-full items-center justify-center"
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <CloseIcon stroke={colors.inkMuted} />
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// FocusRow — same inline reminder used by /sermon/intro
//
// Re-declared here (instead of imported) so the study landing stays
// a self-contained unit and small visual tweaks to the sermon-intro
// version don't ripple unexpectedly. The visual language and copy
// match deliberately.
// ─────────────────────────────────────────────────────────────────

const STUDY_ACCENT = "#0A84FF";

function FocusRow({
  apps,
  onSkip,
}: {
  apps: ReadonlyArray<string>;
  onSkip: () => void;
}) {
  const colors = useColors();
  return (
    <View
      className="rounded-2xl px-3.5 py-3 mb-3 flex-row items-center"
      style={{
        backgroundColor: withAlpha(STUDY_ACCENT, 0.1),
        borderWidth: 1,
        borderColor: withAlpha(STUDY_ACCENT, 0.22),
      }}
    >
      <View
        className="w-7 h-7 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: withAlpha(STUDY_ACCENT, 0.2) }}
      >
        <ShieldGlyph stroke={STUDY_ACCENT} />
      </View>
      <View className="flex-1 pr-2">
        <Text
          className="text-[12px] tracking-[1.5px] uppercase"
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: STUDY_ACCENT,
          }}
        >
          Focus mode
        </Text>
        <Text
          className="text-ink-muted text-[11.5px] mt-0.5"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          numberOfLines={1}
        >
          {summarizeBlockedApps(apps)}
        </Text>
      </View>
      <Pressable
        onPress={onSkip}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Skip focus mode for this session"
        className="rounded-full px-3 py-1.5"
        style={({ pressed }) => ({
          backgroundColor: withAlpha(colors.ink, 0.06),
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          className="text-[11.5px] tracking-[0.5px]"
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: colors.inkMuted,
          }}
        >
          Skip
        </Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons + glow
// ─────────────────────────────────────────────────────────────────

function BookGlyph({ stroke, size = 28 }: { stroke: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2V5z"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path
        d="M6 3v18"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ShieldGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l8 3v6c0 4-3 7-8 9-5-2-8-5-8-9V6l8-3z"
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6l12 12M18 6L6 18"
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function AccentGlow({ color }: { color: string }) {
  return (
    <Svg width={320} height={320} viewBox="0 0 320 320">
      <Defs>
        <RadialGradient id="studyGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <Stop offset="50%" stopColor={color} stopOpacity={0.08} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={320} height={320} fill="url(#studyGlow)" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Compose an alpha into a `#RRGGBB` hex string, returning a CSS
 * `rgba(r, g, b, a)` string. Mirrors the helper used in sermon intro;
 * kept inline here to avoid pulling a shared file just for one fn.
 */
function withAlpha(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return hex;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
