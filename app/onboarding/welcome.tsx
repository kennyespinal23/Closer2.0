import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { FadeIn } from "@/components/FadeIn";
import { useOnboarding } from "@/state/onboarding";
import { useStudySessions } from "@/state/studySessions";
import {
  DEFAULT_BLOCKED_APP_IDS,
  SOCIAL_APPS,
  type SocialAppId,
} from "@/lib/focus";

/**
 * Screen 17 — The Welcome.
 *
 * The payoff. Eight screens of no scripture, no church language —
 * and now this. Black canvas, red scripture, the user's name on
 * the page, and a single forward CTA that drops them into the
 * app.
 *
 * Background side-effects on mount:
 *
 *   1. SEED "Bible Study" system routine. Uses the time the user
 *      picked on /onboarding/studytime, falls back to 7:00 AM if
 *      they somehow skipped it. Focus mode ON, weekday cadence,
 *      blocked-app list lifted from the morningApps they admitted
 *      to on Screen 2 (so the routine silences the exact apps
 *      they self-identified as scroll traps). Editable later from
 *      the Blocks tab or /settings/study-sessions.
 *
 *   2. SEED "Daily Sermon" system routine. Uses the time the user
 *      picked on /onboarding/time, falls back to 7:00 AM. Focus
 *      mode OFF — the daily sermon is a short notification, not
 *      a focus block. This routine ALSO appears in the Practice
 *      tab so the user has one clear list of every recurring
 *      moment Closer touches their day.
 *
 *   3. The actual OS-level sermon notification was already
 *      scheduled by /onboarding/time when the user confirmed
 *      their pick. We don't re-schedule it here — would just
 *      double-up the notifications.
 *
 * Seeding runs once on mount with an idempotency key (the
 * studySessions provider's `upsertSystemSession` matches by name)
 * so re-entering this screen — e.g. via the dev "reset onboarding"
 * affordance — doesn't multiply routines.
 *
 * Why upsertSystemSession (not addSession)?
 *   The provider's upsert matches by (source: "system", name) so
 *   re-running this seed updates the existing system row in place
 *   instead of stacking duplicates. Critical for the dev
 *   "reset and re-onboard" flow but also matters for production —
 *   a user who walks through onboarding and then resets later
 *   shouldn't end up with two "Bible Study" rows.
 */

const SYSTEM_STUDY_NAME = "Bible Study";
const SYSTEM_SERMON_NAME = "Daily Sermon";
// Mon..Fri — the most common cadence per the existing study
// session model. WeekdayIndex is 0=Sun..6=Sat.
const WEEKDAY_DAYS = [1, 2, 3, 4, 5] as const;
// Daily — sermon arrives every day, including weekends. The
// sermon is a passive notification (low effort) so daily makes
// sense; the study commitment stays weekday because asking for
// a daily focus block out of the gate is too much.
const DAILY_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const FALLBACK_TIME = { hour: 7, minute: 0 } as const;

/**
 * Map the morning-apps multi-select (which uses string ids that
 * happen to align with the focus SocialAppId catalog) into the
 * blocked-app list shape. Filters out anything that isn't a
 * known catalog id — defensive in case a future onboarding screen
 * captures additional apps that don't have a focus entry yet.
 */
function morningAppsToBlockedList(
  morningApps: string[] | undefined,
): SocialAppId[] {
  if (!morningApps || morningApps.length === 0) return [];
  const valid = new Set(SOCIAL_APPS.map((a) => a.id));
  return morningApps.filter((id): id is SocialAppId => valid.has(id as SocialAppId));
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { answers } = useOnboarding();
  const { upsertSystemSession } = useStudySessions();

  const firstName = (answers.name || "").trim().split(" ")[0];

  // Track whether we've already attempted the seed this mount,
  // so React strict-mode double-invocations don't double-call
  // upsertSystemSession. The upsert is idempotent by name anyway,
  // but the ref gives us a clean "exactly-once" surface.
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    // Resolve final values up front so the IIFE below is just
    // two flat upsert calls — easier to read than two chained
    // ternaries inside the upsert payloads.
    const studyTime = answers.bibleStudyTime ?? FALLBACK_TIME;
    const sermonTime = answers.dailyReminderTime ?? FALLBACK_TIME;
    const blockedApps = morningAppsToBlockedList(answers.morningApps);
    // Prefer the user's morning-app admission as the focus block
    // list (it's their own self-identified scroll set) but fall
    // back to the catalog default if they skipped that screen or
    // chose none — empty list would silently mean "block nothing"
    // and the routine would be missing its primary value prop.
    const studyBlocked =
      blockedApps.length > 0
        ? blockedApps
        : [...DEFAULT_BLOCKED_APP_IDS];

    // Fire-and-forget. The user's already on the screen; we don't
    // want to block the welcome animation on storage writes or
    // notification scheduling.
    void upsertSystemSession({
      name: SYSTEM_STUDY_NAME,
      source: "system",
      time: studyTime,
      daysOfWeek: [...WEEKDAY_DAYS],
      enabled: true,
      useFocusMode: true,
      blockedAppIds: studyBlocked,
    }).catch(() => {
      // Non-fatal: even if seeding fails, the user can create a
      // routine manually from the Blocks tab. We just don't
      // surface the failure during the welcome moment.
    });

    // Sermon-arrival routine. Focus mode OFF — the sermon is a
    // notification-driven moment, not a block. Daily cadence
    // (including weekends) since the sermon is passive and
    // forming a daily habit is the whole point.
    void upsertSystemSession({
      name: SYSTEM_SERMON_NAME,
      source: "system",
      time: sermonTime,
      daysOfWeek: [...DAILY_DAYS],
      enabled: true,
      useFocusMode: false,
      blockedAppIds: [],
    }).catch(() => {
      // Same rationale as above — onboarding completion shouldn't
      // hinge on background seeding success.
    });
  }, [
    upsertSystemSession,
    answers.bibleStudyTime,
    answers.dailyReminderTime,
    answers.morningApps,
  ]);

  const handleEnterApp = () => {
    // Replace so the user can't swipe-back into the paywall or
    // welcome from inside the app. This is the final boundary
    // between onboarding and the app proper.
    router.replace("/today");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 px-6 justify-center">
          {/* Red eyebrow with the user's name. Caps, tracked
              wide so the type carries weight without going big. */}
          <FadeIn delayMs={300} durationMs={1000}>
            <Text
              style={{
                color: RED,
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 13,
                letterSpacing: 3.5,
                marginBottom: 18,
              }}
            >
              {firstName ? `${firstName.toUpperCase()}, YOU'RE HERE.` : "YOU'RE HERE."}
            </Text>
          </FadeIn>

          <FadeIn delayMs={1200} durationMs={1000}>
            <Text
              style={{
                color: "#FFFFFF",
                fontFamily: "PlusJakartaSans_500Medium",
                fontSize: 17,
                lineHeight: 26,
              }}
            >
              That&apos;s already more than you think.
            </Text>
          </FadeIn>

          <FadeIn delayMs={2200} durationMs={900}>
            <Text
              style={{
                color: "#C2C2C7",
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 16,
                lineHeight: 25,
                marginTop: 18,
              }}
            >
              You don&apos;t have to have it together.{"\n"}
              You just have to show up.
            </Text>
          </FadeIn>

          {/* The scripture card. Red left border + ink-white
              scripture text. The reference is dimmer below. */}
          <FadeIn delayMs={3500} durationMs={1000}>
            <View
              style={{
                marginTop: 36,
                paddingLeft: 18,
                paddingVertical: 4,
                borderLeftWidth: 3,
                borderLeftColor: RED,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "PlusJakartaSans_500Medium",
                  fontStyle: "italic",
                  fontSize: 18,
                  lineHeight: 28,
                  letterSpacing: -0.1,
                }}
              >
                &ldquo;The Lord is close to the brokenhearted{"\n"}
                and saves those who are crushed in spirit.&rdquo;
              </Text>
              <Text
                style={{
                  color: RED,
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 13,
                  letterSpacing: 1.6,
                  marginTop: 12,
                }}
              >
                — PSALM 34:18
              </Text>
            </View>
          </FadeIn>

          <FadeIn delayMs={5000} durationMs={900}>
            <Text
              style={{
                color: "#C2C2C7",
                fontFamily: "PlusJakartaSans_500Medium",
                fontSize: 15,
                lineHeight: 23,
                marginTop: 28,
              }}
            >
              Your first word.
            </Text>
          </FadeIn>
        </View>

        {/* Final CTA — wide, ink-white pill. Same visual idiom as
            the paywall CTA so the user's last two actions on the
            black canvas feel consistent. */}
        <FadeIn delayMs={5800} durationMs={900}>
          <View className="px-6 pb-4">
            <Pressable
              onPress={handleEnterApp}
              accessibilityRole="button"
              accessibilityLabel="Enter the app"
              style={({ pressed }) => ({
                height: 56,
                borderRadius: 16,
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{
                  color: "#000000",
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 16,
                  letterSpacing: 0.1,
                }}
              >
                I&apos;m ready
              </Text>
            </Pressable>
          </View>
        </FadeIn>
      </SafeAreaView>
    </View>
  );
}

// Single red used on the eyebrow, the scripture card's left
// border, and the reference label. Matches the spec's "red
// scripture text" cue. Same RED as the calculating screen's
// progress bar — it's the only color in the whole onboarding,
// and it appears at the start (calculating loader) and the end
// (welcome scripture). Bookends.
const RED = "#E53935";
