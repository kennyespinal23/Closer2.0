import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { BrandMark } from "@/components/BrandMark";
import { PrimaryPillButton } from "@/components/PrimaryPillButton";
import { SFSymbol } from "@/components/Symbol";
import { CLOSER_ACCENT } from "@/constants/theme";
import {
  configureCloserShieldUI,
  isScreenTimeShieldReady,
} from "@/lib/deviceActivityShield";
import {
  DEFAULT_BLOCKED_APP_IDS,
  SOCIAL_APPS,
  type SocialAppId,
} from "@/lib/focus";
import { SF_PRO } from "@/lib/typography";
import { useFocus } from "@/state/focus";
import { useOnboarding } from "@/state/onboarding";
import { useStudySessions } from "@/state/studySessions";
import { useSubscription } from "@/state/subscription";
import { useColors } from "@/state/theme";

const TERMS_URL = "https://closer.app/terms";
const PRIVACY_URL = "https://closer.app/privacy";

/** Yellow savings chip — matches the reference badge treatment. */
const POPULAR_YELLOW = "#FFE14A";

/** Short phones (SE / 16e class) need denser paywall chrome. */
const COMPACT_HEIGHT = 740;

const FALLBACK_TIME = { hour: 7, minute: 0 } as const;
const SYSTEM_STUDY_NAME = "Bible Study";
const SYSTEM_SERMON_NAME = "Daily Sermon";
const WEEKDAY_DAYS = [1, 2, 3, 4, 5] as const;
const DAILY_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

type PlanId = "monthly" | "annual";

type TimelineStep = {
  title: string;
  body: string;
  icon: "checkmark" | "lock.fill" | "bell.fill" | "heart.fill";
  state: "done" | "current" | "upcoming";
};

const TIMELINE: ReadonlyArray<TimelineStep> = [
  {
    title: "Complete Sign-up",
    body: "You successfully created your profile.",
    icon: "checkmark",
    state: "done",
  },
  {
    title: "Today: Get Instant Access",
    body: "Unlock our most requested features!",
    icon: "lock.fill",
    state: "current",
  },
  {
    title: "Day 5: Get Trial Reminder",
    body: "We'll send you an email/notification.",
    icon: "bell.fill",
    state: "upcoming",
  },
  {
    title: "Day 7: Trial Ends",
    body: "You'll be charged in 7 days, cancel anytime before in the App Store.",
    icon: "heart.fill",
    state: "upcoming",
  },
];

function morningAppsToBlockedList(
  morningApps: string[] | undefined,
): SocialAppId[] {
  if (!morningApps || morningApps.length === 0) return [];
  const valid = new Set(SOCIAL_APPS.map((a) => a.id));
  return morningApps.filter((id): id is SocialAppId =>
    valid.has(id as SocialAppId),
  );
}

export default function PaywallScreen() {
  const router = useRouter();
  const colors = useColors();
  const { height: windowHeight } = useWindowDimensions();
  const compact = windowHeight < COMPACT_HEIGHT;
  const { answers, setAnswer } = useOnboarding();
  const { upsertSystemSession } = useStudySessions();
  const { setEnabled } = useFocus();
  const {
    configured,
    isPro,
    monthlyPackage,
    restore,
  } = useSubscription();

  const [plan, setPlan] = useState<PlanId>("annual");
  const seededRef = useRef(false);

  const monthlyPrice =
    monthlyPackage?.product.priceString?.replace(/\s+/g, "") ?? "$7.99";
  const brandSize = compact ? 56 : 72;
  const heroWell = compact ? 88 : 120;

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;

    const studyTime = answers.bibleStudyTime ?? FALLBACK_TIME;
    const sermonTime = answers.dailyReminderTime ?? FALLBACK_TIME;
    const blockedApps = morningAppsToBlockedList(answers.morningApps);
    const studyBlocked =
      blockedApps.length > 0 ? blockedApps : [...DEFAULT_BLOCKED_APP_IDS];

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

  const finishOnboarding = () => {
    setAnswer("completed", true);
    router.replace("/today");
  };

  useEffect(() => {
    if (!isPro) return;
    setAnswer("completed", true);
    router.replace("/today");
  }, [isPro, setAnswer, router]);

  const handleStart = () => {
    // Placeholder — enter the app without requiring a live purchase.
    finishOnboarding();
  };

  const handleRestore = async () => {
    if (!configured) {
      Alert.alert(
        "Subscriptions aren't ready",
        "Finish RevenueCat setup, add your API key, and rebuild the app.",
        [{ text: "OK" }],
      );
      return;
    }

    try {
      const active = await restore();
      if (active) {
        finishOnboarding();
        return;
      }
      Alert.alert(
        "No subscription found",
        "We couldn't find an active Closer subscription for this Apple ID.",
        [{ text: "OK" }],
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Couldn't restore purchases.";
      Alert.alert("Restore failed", message, [{ text: "OK" }]);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={finishOnboarding}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
          >
            <View style={styles.closeHit}>
              <SFSymbol
                name="xmark"
                size={15}
                color={colors.ink}
                weight="bold"
              />
            </View>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={[
            styles.scroll,
            compact && styles.scrollCompact,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces
        >
          <View
            style={[
              styles.hero,
              compact && { marginTop: 0, marginBottom: 12 },
            ]}
          >
            <View
              style={[
                styles.heroWell,
                {
                  width: heroWell,
                  height: heroWell,
                  borderRadius: compact ? 24 : 32,
                  backgroundColor: "rgba(255, 67, 38, 0.12)",
                },
              ]}
            >
              <BrandMark size={brandSize} />
            </View>
          </View>

          <Text
            accessibilityRole="header"
            style={[
              styles.headline,
              compact && styles.headlineCompact,
              { color: colors.ink },
            ]}
          >
            How your 7-day free{"\n"}trial works
          </Text>

          <View style={[styles.timeline, compact && styles.timelineCompact]}>
            {TIMELINE.map((step, index) => (
              <TimelineRow
                key={step.title}
                step={step}
                isLast={index === TIMELINE.length - 1}
                compact={compact}
              />
            ))}
          </View>

          <View style={[styles.plans, compact && { gap: 12 }]}>
            <PlanCard
              selected={plan === "monthly"}
              onPress={() => setPlan("monthly")}
              title="Monthly"
              priceRight={`${monthlyPrice} / MO`}
              compact={compact}
            />
            <PlanCard
              selected={plan === "annual"}
              onPress={() => setPlan("annual")}
              title="Yearly"
              badge="SAVE 50%"
              priceRight="$4.99 / MO"
              priceMain="$59.99"
              priceWas="$95.88"
              compact={compact}
            />
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            compact && styles.footerCompact,
            { borderTopColor: colors.border },
          ]}
        >
          <PrimaryPillButton
            label="Try FREE and Subscribe"
            onPress={handleStart}
            accessibilityLabel="Try free and subscribe"
          />

          <View style={styles.footLinks}>
            <FootLink label="Restore" onPress={handleRestore} />
            <FootDot />
            <FootLink label="Terms" onPress={() => Linking.openURL(TERMS_URL)} />
            <FootDot />
            <FootLink
              label="Privacy"
              onPress={() => Linking.openURL(PRIVACY_URL)}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function TimelineRow({
  step,
  isLast,
  compact,
}: {
  step: TimelineStep;
  isLast: boolean;
  compact?: boolean;
}) {
  const colors = useColors();
  const filled = step.state === "done" || step.state === "current";
  const isDone = step.state === "done";

  return (
    <View style={[styles.timelineRow, compact && { minHeight: 48 }]}>
      <View style={styles.timelineRail}>
        {filled ? (
          <View style={[styles.timelineDot, { backgroundColor: CLOSER_ACCENT }]}>
            <SFSymbol
              name={step.icon}
              size={13}
              color="#FFFFFF"
              weight="bold"
            />
          </View>
        ) : (
          <View style={styles.timelineIconOnly}>
            <SFSymbol
              name={step.icon}
              size={18}
              color={colors.ink}
              weight="semibold"
            />
          </View>
        )}
        {!isLast ? (
          <View
            style={[styles.timelineLine, { backgroundColor: colors.border }]}
          />
        ) : null}
      </View>

      <View
        style={[
          styles.timelineCopy,
          compact && { paddingBottom: 10, paddingTop: 1 },
        ]}
      >
        <Text
          style={[
            styles.timelineTitle,
            isDone
              ? {
                  color: CLOSER_ACCENT,
                  fontWeight: "600",
                  textDecorationLine: "line-through",
                }
              : { color: colors.ink, fontWeight: "700" },
          ]}
        >
          {step.title}
        </Text>
        <Text style={[styles.timelineBody, { color: colors.inkMuted }]}>
          {step.body}
        </Text>
      </View>
    </View>
  );
}

function PlanCard({
  selected,
  onPress,
  title,
  priceRight,
  priceMain,
  priceWas,
  badge,
  compact,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  priceRight: string;
  priceMain?: string;
  priceWas?: string;
  badge?: string;
  compact?: boolean;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      <View
        style={[
          styles.planCard,
          compact && styles.planCardCompact,
          {
            backgroundColor: colors.surface,
            borderColor: selected ? CLOSER_ACCENT : colors.border,
            borderWidth: selected ? 2.5 : 1.5,
          },
        ]}
      >
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}

        <View style={styles.planLeft}>
          <Text style={[styles.planTitle, { color: colors.ink }]}>{title}</Text>
          {priceMain ? (
            <View style={styles.planPriceRow}>
              {priceWas ? (
                <Text style={[styles.priceWas, { color: colors.inkMuted }]}>
                  {priceWas}
                </Text>
              ) : null}
              <Text style={[styles.priceMain, { color: colors.ink }]}>
                {priceMain}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.planRight}>
          <Text style={[styles.planPriceRight, { color: colors.ink }]}>
            {priceRight}
          </Text>
          <View
            style={[
              styles.radio,
              {
                borderColor: selected ? CLOSER_ACCENT : colors.borderStrong,
                backgroundColor: selected ? CLOSER_ACCENT : "transparent",
              },
            ]}
          >
            {selected ? (
              <SFSymbol
                name="checkmark"
                size={12}
                color="#FFFFFF"
                weight="bold"
              />
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function FootLink({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable hitSlop={8} onPress={onPress}>
      <Text style={[styles.footLink, { color: colors.inkMuted }]}>{label}</Text>
    </Pressable>
  );
}

function FootDot() {
  const colors = useColors();
  return (
    <View style={[styles.footDot, { backgroundColor: colors.borderStrong }]} />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    paddingHorizontal: 16,
    height: 44,
    justifyContent: "center",
  },
  closeHit: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollFlex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 28,
    paddingBottom: 28,
    flexGrow: 1,
  },
  scrollCompact: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  hero: {
    alignItems: "center",
    marginTop: 2,
    marginBottom: 18,
  },
  heroWell: {
    alignItems: "center",
    justifyContent: "center",
  },
  // Reference: heavy centered headline (~26–28), tight leading.
  headline: {
    fontFamily: SF_PRO,
    fontWeight: "800",
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.7,
    textAlign: "center",
  },
  headlineCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  timeline: {
    marginTop: 32,
    marginBottom: 32,
  },
  timelineCompact: {
    marginTop: 18,
    marginBottom: 18,
  },
  timelineRow: {
    flexDirection: "row",
    minHeight: 58,
  },
  timelineRail: {
    width: 28,
    alignItems: "center",
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineIconOnly: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 1,
  },
  timelineCopy: {
    flex: 1,
    paddingLeft: 14,
    paddingBottom: 16,
    paddingTop: 3,
  },
  // Active titles: bold 700 @ 16. Done: semibold + accent + strike.
  timelineTitle: {
    fontFamily: SF_PRO,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.3,
  },
  timelineBody: {
    fontFamily: SF_PRO,
    fontWeight: "400",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  plans: {
    gap: 14,
    paddingTop: 4,
  },
  planCard: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planCardCompact: {
    paddingVertical: 14,
    minHeight: 60,
  },
  badge: {
    position: "absolute",
    top: -11,
    left: 16,
    backgroundColor: POPULAR_YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  badgeText: {
    fontFamily: SF_PRO,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.4,
    color: "#111111",
  },
  planLeft: {
    flex: 1,
    paddingRight: 12,
  },
  planTitle: {
    fontFamily: SF_PRO,
    fontWeight: "700",
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  planPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  priceWas: {
    fontFamily: SF_PRO,
    fontWeight: "400",
    fontSize: 14,
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  priceMain: {
    fontFamily: SF_PRO,
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: -0.2,
  },
  planRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  planPriceRight: {
    fontFamily: SF_PRO,
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: -0.2,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  footerCompact: {
    paddingTop: 8,
    paddingBottom: 6,
  },
  footLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    gap: 10,
  },
  footLink: {
    fontFamily: SF_PRO,
    fontWeight: "500",
    fontSize: 12,
  },
  footDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
  },
});
