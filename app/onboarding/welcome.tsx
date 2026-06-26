import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { HeroDisc, HeroOnboardingPage } from "@/components/HeroOnboardingPage";
import { useOnboarding } from "@/state/onboarding";
import { useColors } from "@/state/theme";
import {
  configureCloserShieldUI,
  isScreenTimeShieldReady,
} from "@/lib/deviceActivityShield";
import { useFocus } from "@/state/focus";
import { useStudySessions } from "@/state/studySessions";
import {
  DEFAULT_BLOCKED_APP_IDS,
  SOCIAL_APPS,
  type SocialAppId,
} from "@/lib/focus";

/**
 * Screen — The Welcome.
 *
 * The payoff. Onboarding has been a series of beats — audit,
 * diagnosis, punch, proof, brand reveal, mechanism — and this
 * is the threshold the user crosses to enter the app proper.
 *
 * Built on the shared <HeroOnboardingPage> shell with the
 * WINE palette — deep burgundy, soft burgundy halo. Wine has
 * sanctuary / Eucharistic weight in Christian tradition, which
 * is the right note for the "you've stepped into something
 * sacred" beat. It's also distinct from every other Hallow page
 * in the flow, so the user feels they've walked into the final
 * room of the journey.
 *
 * Subject for this beat: the scripture itself, framed in the
 * disc. The Word IS the centerpiece — not a number, not a brand
 * mark, not an icon. The verse becomes the portrait subject the
 * same way Mother Teresa was on the Hallow reference. The
 * reference (Psalm 34:18) acts as the "attribution" inside the
 * disc, parallel to how the source / speaker name appeared on
 * the reference page.
 *
 * Side-effects on mount (preserved exactly from the previous
 * version — the visual is changing, the wiring is not):
 *
 *   1. SEED "Bible Study" system routine — uses /studytime time,
 *      weekday cadence, focus mode ON, blocks the user's
 *      morning-apps admission.
 *   2. SEED "Daily Sermon" system routine — uses /time, daily
 *      cadence, focus mode OFF.
 *
 * On CTA tap: sets `completed = true` then router.replace("/today")
 * so cold launches bypass the onboarding flow.
 */

const FALLBACK_TIME = { hour: 7, minute: 0 } as const;

const SYSTEM_STUDY_NAME = "Bible Study";
const SYSTEM_SERMON_NAME = "Daily Sermon";
const WEEKDAY_DAYS = [1, 2, 3, 4, 5] as const;
const DAILY_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

function morningAppsToBlockedList(
  morningApps: string[] | undefined,
): SocialAppId[] {
  if (!morningApps || morningApps.length === 0) return [];
  const valid = new Set(SOCIAL_APPS.map((a) => a.id));
  return morningApps.filter((id): id is SocialAppId =>
    valid.has(id as SocialAppId),
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { answers, setAnswer } = useOnboarding();
  const { upsertSystemSession } = useStudySessions();
  const { setEnabled } = useFocus();

  const firstName = (answers.name || "").trim().split(" ")[0];

  // One-shot guard against React strict-mode double-invocation
  // OR a rapid remount. The upsert is idempotent by name anyway,
  // but the ref keeps the call surface clean.
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;

    const studyTime = answers.bibleStudyTime ?? FALLBACK_TIME;
    const sermonTime = answers.dailyReminderTime ?? FALLBACK_TIME;
    const blockedApps = morningAppsToBlockedList(answers.morningApps);
    // Prefer the user's self-identified scroll set; fall back to
    // the catalog default so the routine never silently blocks
    // nothing (which would leave it without its primary value).
    const studyBlocked =
      blockedApps.length > 0 ? blockedApps : [...DEFAULT_BLOCKED_APP_IDS];

    // Fire-and-forget. The user is on the welcome screen; we
    // don't want to block the visuals on storage writes or
    // notification scheduling.
    void upsertSystemSession({
      name: SYSTEM_STUDY_NAME,
      source: "system",
      time: studyTime,
      daysOfWeek: [...WEEKDAY_DAYS],
      enabled: true,
      useFocusMode: true,
      blockedAppIds: studyBlocked,
    }).catch(() => {});

    void upsertSystemSession({
      name: SYSTEM_SERMON_NAME,
      source: "system",
      time: sermonTime,
      daysOfWeek: [...DAILY_DAYS],
      enabled: true,
      useFocusMode: false,
      blockedAppIds: [],
    }).catch(() => {});

    if (answers.screenTimeConfigured || isScreenTimeShieldReady()) {
      configureCloserShieldUI();
      setEnabled(true);
    }
  }, [
    upsertSystemSession,
    answers.bibleStudyTime,
    answers.dailyReminderTime,
    answers.morningApps,
    answers.screenTimeConfigured,
    setEnabled,
  ]);

  const handleEnterApp = () => {
    // Set completed BEFORE navigating so the persistence layer
    // flushes the flag. Next cold launch reads it in
    // app/index.tsx and routes straight to /today.
    setAnswer("completed", true);
    // Replace so back-swipe out of the app proper doesn't land
    // on the welcome screen.
    router.replace("/today");
  };

  const eyebrow = firstName
    ? `${firstName.toUpperCase()} — YOU'RE HERE`
    : "YOU'RE HERE";

  return (
    <HeroOnboardingPage
      eyebrow={eyebrow}
      showBack={false}
      subject={
        <HeroDisc size={216} innerPaddingVertical={20}>
          <Text
            style={{
              color: colors.ink,
              fontFamily: "System",
              fontWeight: "600",
              fontSize: 15.5,
              lineHeight: 22,
              letterSpacing: -0.1,
              textAlign: "center",
              paddingHorizontal: 18,
            }}
          >
            &ldquo;The Lord is close to the brokenhearted.&rdquo;
          </Text>
          <View style={{ marginTop: 10 }}>
            <Text
              style={{
                color: colors.inkSecondary,
                fontFamily: "System",
                fontWeight: "700",
                fontSize: 11,
                letterSpacing: 1.8,
                textTransform: "uppercase",
              }}
            >
              Psalm 34:18
            </Text>
          </View>
        </HeroDisc>
      }
      quoteSetup="You don't have to have it together."
      quoteEmphasis="You just have to show up."
      attribution="Your first word."
      ctaLabel="I'm ready"
      onContinue={handleEnterApp}
      ctaTextColor="#1F0407"
    />
  );
}
