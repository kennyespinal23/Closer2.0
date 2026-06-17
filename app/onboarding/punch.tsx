import { useMemo } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { HeroDisc, HeroOnboardingPage } from "@/components/HeroOnboardingPage";
import { useOnboarding, type ScrollBucket } from "@/state/onboarding";
import { useColors } from "@/state/theme";

/**
 * Screen — The Gut Punch.
 *
 * Personalized reveal of the YEARLY consequence of the user's
 * morning routine. The user named the apps on /apps and the
 * duration on /scrolltime; this screen pulls those answers,
 * does the math, and puts the number on the wall.
 *
 * Built on the shared <HeroOnboardingPage> shell with the
 * CRIMSON palette — saturated alarm red, hotter halo. Red is
 * the only Hallow-page palette that reads as "stop and look"
 * instead of "sit with this" — appropriate for a number meant
 * to land hard.
 *
 * Subject for this beat: the headline number itself (e.g. "730")
 * inside the disc, with "times / year" as the unit caption. The
 * quote below names the apps it took to get there ("Instagram &
 * TikTok") and the attribution names the per-day cost.
 *
 * Math (preserved from the previous black-canvas version):
 *
 *   • timesPerYear = 365 × numberOfAppsPicked
 *   • dailyMinutesPhrase = midpoint of scrollBucket, with the
 *     "I don't want to know" bucket leaning to the higher half
 *
 * The previous version used "Listen," as a salutation because
 * the user hadn't given their name yet. Now name capture happens
 * before this screen, so we can address them by first name —
 * making the punch land as a personal callout rather than a
 * generic billboard.
 */

export default function PunchScreen() {
  const router = useRouter();
  const colors = useColors();
  const { answers } = useOnboarding();

  const apps = answers.morningApps ?? [];
  const scrollBucket = answers.scrollBucket ?? "thirty60";
  const firstName = (answers.name || "").trim().split(" ")[0];

  const punch = useMemo(
    () => buildPunch(apps, scrollBucket),
    [apps, scrollBucket],
  );

  // Eyebrow is the user's name if we have it (now likely, since
  // name capture happens before this screen). Falls back to a
  // generic callout otherwise.
  const eyebrow = firstName ? `${firstName.toUpperCase()} — LISTEN` : "LISTEN";

  // Quote setup names the apps; emphasis delivers the year math.
  const quoteSetup = `You'll open ${punch.appNamePhrase}`;
  const quoteEmphasis = `${punch.timesPerYear.toLocaleString()} times before God this year.`;

  // Attribution-style line names the per-day cost. Same emphasis
  // as the previous "That's X minutes of your morning. Every
  // day." beat — compressed to one line so it fits in the small
  // attribution slot.
  const attribution = `That's ${punch.dailyMinutesPhrase} of your morning, every day.`;

  return (
    <HeroOnboardingPage
      eyebrow={eyebrow}
      subject={
        <HeroDisc>
          <Text
            style={{
              color: colors.ink,
              fontFamily: "System",
              fontWeight: "700",
              fontSize: 64,
              letterSpacing: -2.4,
              lineHeight: 68,
            }}
          >
            {punch.timesPerYear.toLocaleString()}
          </Text>
          <View style={{ marginTop: 4 }}>
            <Text
              style={{
                color: colors.inkSecondary,
                fontFamily: "System",
                fontWeight: "500",
                fontSize: 13,
                letterSpacing: 1.4,
                textTransform: "uppercase",
              }}
            >
              times / year
            </Text>
          </View>
        </HeroDisc>
      }
      quoteSetup={quoteSetup}
      quoteEmphasis={quoteEmphasis}
      attribution={attribution}
      ctaLabel="Continue"
      onContinue={() => router.push("/onboarding/proof")}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// Punch math — unchanged from the previous version.
// ─────────────────────────────────────────────────────────────────

const PUNCH_NAMES: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
  facebook: "Facebook",
  news: "the news",
};

const BUCKET_MIDPOINT_MIN: Record<ScrollBucket, number> = {
  under15: 12,
  fifteen30: 22,
  thirty60: 45,
  overHour: 75,
  unknown: 45,
};

type PunchCopy = {
  /** "Instagram", "Instagram & TikTok", "Instagram, TikTok & 2 more", etc. */
  appNamePhrase: string;
  /** 365 × number of apps picked. The headline number on the page. */
  timesPerYear: number;
  /** Per-day cost phrase used in the attribution slot — e.g. "22
   *  minutes", "well over an hour". */
  dailyMinutesPhrase: string;
};

function buildPunch(
  appIds: ReadonlyArray<string>,
  scrollBucket: ScrollBucket,
): PunchCopy {
  const namedApps = appIds
    .filter((id) => id !== "other")
    .map((id) => PUNCH_NAMES[id] ?? null)
    .filter((n): n is string => n !== null);

  const appCount = Math.max(1, appIds.length);
  const timesPerYear = 365 * appCount;

  let appNamePhrase: string;
  if (namedApps.length === 0) {
    appNamePhrase = "those apps";
  } else if (namedApps.length === 1) {
    appNamePhrase = namedApps[0];
  } else if (namedApps.length === 2) {
    appNamePhrase = `${namedApps[0]} & ${namedApps[1]}`;
  } else {
    const overflow = namedApps.length - 2;
    appNamePhrase = `${namedApps[0]}, ${namedApps[1]} & ${overflow} more`;
  }

  const dailyMinutesPhrase =
    scrollBucket === "unknown"
      ? "well over an hour"
      : scrollBucket === "overHour"
        ? "over an hour"
        : `${BUCKET_MIDPOINT_MIN[scrollBucket]} minutes`;

  return { appNamePhrase, timesPerYear, dailyMinutesPhrase };
}
