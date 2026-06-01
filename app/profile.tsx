import { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useAnnotations } from "@/state/annotations";
import { useFocus } from "@/state/focus";
import { useOnboarding } from "@/state/onboarding";
import { usePreferences } from "@/state/preferences";
import { didCompleteToday, useProgress } from "@/state/progress";
import { useReadingGoal } from "@/state/readingGoal";
import { useStudySessions } from "@/state/studySessions";
import { useColors, useTheme, type ThemePref } from "@/state/theme";

/**
 * Profile (left-side drawer)
 *
 * Slides in from the left over the home screen. The backdrop dims
 * the visible portion of the home and dismisses the drawer when
 * tapped. The panel itself is anchored to the left edge with rounded
 * right corners — classic mobile drawer pattern.
 *
 * Animation:
 *   - on mount: panel springs from -drawerWidth → 0, backdrop fades 0 → ~0.55
 *   - on dismiss: timing 0 → -drawerWidth, backdrop fades back to 0,
 *                 then router.back() pops the transparentModal route
 *
 * The route is registered in app/_layout.tsx as a `transparentModal`
 * with `animation: "none"` so the OS doesn't impose its own
 * presentation animation on top of ours.
 */
export default function ProfileScreen() {
  // Drawer-scoped derivations: identity, counts, theme.
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { answers } = useOnboarding();
  const { totalCompletions } = useProgress();
  const progress = useProgress();
  const { translation } = usePreferences();
  const { counts: annotationCounts } = useAnnotations();
  const { goalMinutes: readingGoalMinutes } = useReadingGoal();
  const { prefs: focusPrefs } = useFocus();
  const { sessions: studySessions } = useStudySessions();
  const colors = useColors();
  const { pref: themePref } = useTheme();

  const firstName = (answers.name || "").trim().split(" ")[0] || "Friend";
  const honoredToday = didCompleteToday(progress);
  const appearanceValue = APPEARANCE_LABEL[themePref];

  // Drawer takes ~86% of the screen — leaves a clear strip of home
  // visible on the right so the user understands they're in a layer
  // OVER the home screen, not a replacement of it.
  const drawerWidth = Math.min(screenWidth * 0.86, 360);

  const translateX = useRef(new Animated.Value(-drawerWidth)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 13,
      }),
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateX, backdrop]);

  // Optional `next` runs in place of `router.back()` once the
  // dismiss animation lands. We use this for drawer rows that
  // navigate to another screen — the close animation runs first
  // so the drawer + dim backdrop are gone before the pushed
  // screen appears, instead of stacking under the open drawer.
  const close = useCallback(
    (next?: () => void) => {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -drawerWidth,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        // `finished` is false if the user dismissed twice quickly
        // and the animation got interrupted — either way we still
        // want to either pop the route or jump to `next` once the
        // slide is done.
        if (!finished) return;
        if (next) {
          next();
        } else {
          router.back();
        }
      });
    },
    [translateX, backdrop, drawerWidth, router],
  );

  // Dismiss the drawer, then push the requested route. The push
  // REPLACES the profile route in the stack (router.replace) so
  // the user doesn't have to back-tap twice to return to /today
  // — drawer was a launcher, not a step in the journey.
  const navigateTo = useCallback(
    (href: Href) => {
      close(() => router.replace(href));
    },
    [close, router],
  );

  return (
    <View style={{ flex: 1 }}>
      {/* ─── Backdrop ─────────────────────────────────────────────
          Sits over the home screen + tab bar. Animated opacity so the
          dim fades in/out with the panel. Tap anywhere to close. */}
      <Animated.View
        pointerEvents="auto"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#000",
          opacity: backdrop.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.55],
          }),
        }}
      >
        <Pressable onPress={() => close()} style={{ flex: 1 }} />
      </Animated.View>

      {/* ─── Drawer panel ────────────────────────────────────────
          Anchored to the left edge. Top/bottom span full screen so the
          panel feels structural, not a card. Right corners rounded so
          it reads as a drawer rather than a sidebar. */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: drawerWidth,
          backgroundColor: colors.bg,
          borderTopRightRadius: 28,
          borderBottomRightRadius: 28,
          overflow: "hidden",
          // Subtle right-edge shadow so the panel separates from the
          // dimmed home behind it. The shadow stays pure black in
          // both themes — a tinted shadow against a light backdrop
          // would read as a colored halo, not depth.
          shadowColor: "#000",
          shadowOpacity: 0.5,
          shadowRadius: 28,
          shadowOffset: { width: 8, height: 0 },
          elevation: 24,
          transform: [{ translateX }],
        }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* ─── Identity ─────────────────────────────────────── */}
            <View className="px-6 pt-2 flex-row items-center">
              <View className="w-14 h-14 rounded-full bg-accent-soft border border-border items-center justify-center mr-4">
                <Text
                  className="text-primary text-[22px]"
                  style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                >
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="text-ink text-[18px] tracking-[-0.2px]"
                  style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                  numberOfLines={1}
                >
                  {firstName}
                </Text>
                <Text
                  className="text-ink-subtle text-[12.5px] mt-0.5"
                  style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                  numberOfLines={1}
                >
                  Drawing nearer, one day at a time
                </Text>
              </View>
              <Pressable
                hitSlop={12}
                onPress={() => close()}
                accessibilityRole="button"
                accessibilityLabel="Close profile"
                className="w-9 h-9 rounded-full items-center justify-center"
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M6 6l12 12M18 6L6 18"
                    stroke={colors.ink}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  />
                </Svg>
              </Pressable>
            </View>

            {/* ─── Stat cards ───────────────────────────────────── */}
            <View className="px-6 mt-6 flex-row gap-3">
              <StatCard
                icon={
                  <FlameIcon
                    active={honoredToday}
                    stroke={colors.inkMuted}
                  />
                }
                value={honoredToday ? "Today" : "—"}
                label={honoredToday ? "Honored today" : "Today is waiting"}
              />
              <StatCard
                icon={<RhythmIcon stroke={colors.ink} />}
                value={String(totalCompletions)}
                label={totalCompletions === 1 ? "Sermon" : "Sermons"}
              />
            </View>

            {/* ─── Personal scripture work ──────────────────────
                Surfaces direct entry points to the user's accumulated
                notes and highlights so they're never more than two
                taps away from anything they've saved. "Your Practice"
                lives at the top — it's the rhythm view (streak, total
                sermons, per-type breakdown) that used to be its own
                tab before the Insights tab became a content library. */}
            <Section title="Your scripture">
              <Row
                icon={<RhythmIcon stroke={colors.ink} />}
                label="Your Practice"
                value="Streak · Reading"
                interactive
                chevronStroke={colors.inkSubtle}
                onPress={() => navigateTo("/stats")}
                showDivider
              />
              <Row
                icon={<NoteRowIcon stroke={colors.ink} />}
                label="Notes"
                value={String(annotationCounts.notes)}
                interactive
                chevronStroke={colors.inkSubtle}
                onPress={() => navigateTo("/notes")}
                showDivider
              />
              <Row
                icon={<HighlightRowIcon stroke={colors.ink} />}
                label="Highlights"
                value={String(annotationCounts.highlights)}
                interactive
                chevronStroke={colors.inkSubtle}
                onPress={() => navigateTo("/highlights")}
              />
            </Section>

            {/* ─── Quick links ──────────────────────────────────── */}
            <Section title="Account">
              <Row
                icon={<UserIcon stroke={colors.ink} />}
                label="Your name"
                value={firstName}
                interactive
                chevronStroke={colors.inkSubtle}
                onPress={() => navigateTo("/settings/name")}
                showDivider
              />
              <Row
                icon={<MailIcon stroke={colors.ink} />}
                label="Email"
                value="Not signed in"
                interactive
                chevronStroke={colors.inkSubtle}
                onPress={() => navigateTo("/settings/account")}
              />
            </Section>

            <Section title="Preferences">
              <Row
                icon={<TargetIcon stroke={colors.ink} />}
                label="Reading goal"
                value={`${readingGoalMinutes} min`}
                interactive
                chevronStroke={colors.inkSubtle}
                onPress={() => navigateTo("/settings/reading-goal")}
                showDivider
              />
              <Row
                icon={<BellIcon stroke={colors.ink} />}
                label="Notifications"
                value="Manage"
                interactive
                chevronStroke={colors.inkSubtle}
                onPress={() => navigateTo("/settings/notifications")}
                showDivider
              />
              <Row
                icon={<BookIcon stroke={colors.ink} />}
                label="Bible version"
                value={translation.name}
                interactive
                chevronStroke={colors.inkSubtle}
                onPress={() => navigateTo("/settings/translation")}
                showDivider
              />
              <Row
                icon={<ShieldRowIcon stroke={colors.ink} />}
                label="Focus mode"
                value={focusPrefs.enabled ? "On" : "Off"}
                interactive
                chevronStroke={colors.inkSubtle}
                onPress={() => navigateTo("/settings/focus")}
                showDivider
              />
              <Row
                icon={<StudyIcon stroke={colors.ink} />}
                label="Study sessions"
                value={studySessionsRowValue(studySessions)}
                interactive
                chevronStroke={colors.inkSubtle}
                onPress={() => navigateTo("/settings/study-sessions")}
                showDivider
              />
              <Row
                icon={<MoonIcon stroke={colors.ink} />}
                label="Appearance"
                value={appearanceValue}
                interactive
                chevronStroke={colors.inkSubtle}
                onPress={() => navigateTo("/settings/appearance")}
              />
            </Section>

            {/* ─── Soft promo ───────────────────────────────────── */}
            <View className="px-6 mt-7">
              <View className="rounded-2xl overflow-hidden bg-surface border border-border px-5 py-5">
                <Text
                  className="text-ink text-[15px] leading-[21px]"
                  style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
                >
                  You&apos;re building something quiet.
                </Text>
                <Text
                  className="text-ink-muted text-[12.5px] leading-[18px] mt-1.5"
                  style={{ fontFamily: "PlusJakartaSans_400Regular" }}
                >
                  Every sermon completed is a small turn of the heart toward Him.
                </Text>
              </View>
            </View>

            <Section title="About">
              <Row
                icon={<HeartIcon stroke={colors.ink} />}
                label="Help & support"
                interactive
                chevronStroke={colors.inkSubtle}
                onPress={() => navigateTo("/settings/help")}
                showDivider
              />
              <Row
                icon={<DocIcon stroke={colors.ink} />}
                label="Privacy"
                interactive
                chevronStroke={colors.inkSubtle}
                onPress={() => navigateTo("/settings/privacy")}
                showDivider
              />
              <Row
                icon={<InfoIcon stroke={colors.ink} />}
                label="Version"
                value="0.1.0"
                chevronStroke={colors.inkSubtle}
              />
            </Section>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Stat card — the small two-up tiles at the top of the drawer
// ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View className="flex-1 rounded-2xl border border-border bg-surface px-4 py-3.5">
      <View className="flex-row items-center">
        <View className="w-7 h-7 rounded-full bg-accent-soft items-center justify-center mr-2">
          {icon}
        </View>
        <Text
          className="text-ink text-[18px] tracking-[-0.3px]"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {value}
        </Text>
      </View>
      <Text
        className="text-ink-subtle text-[11.5px] mt-2"
        style={{ fontFamily: "PlusJakartaSans_500Medium" }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Section — eyebrow + a rounded card containing list rows
// ─────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="px-6 mt-7">
      <Text
        className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase mb-2.5 ml-1"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        {title}
      </Text>
      <View className="rounded-2xl border border-border bg-surface overflow-hidden">
        {children}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Row — a single list item inside a Section card
// ─────────────────────────────────────────────────────────────────

type RowProps = {
  icon: React.ReactNode;
  label: string;
  value?: string;
  interactive?: boolean;
  /** Called on tap. Only fires when `interactive` is true. */
  onPress?: () => void;
  showDivider?: boolean;
  /** Stroke color for the trailing chevron — passed down from the
   *  drawer's `useColors()` so it flips with the active theme. */
  chevronStroke: string;
};

function Row({
  icon,
  label,
  value,
  interactive,
  onPress,
  showDivider,
  chevronStroke,
}: RowProps) {
  const Inner = (
    <View className="flex-row items-center px-4 py-3">
      <View className="w-8 h-8 rounded-xl bg-accent-soft items-center justify-center mr-3">
        {icon}
      </View>
      <Text
        className="text-ink text-[14px] flex-1"
        style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
      >
        {label}
      </Text>
      {value && (
        <Text
          className="text-ink-muted text-[12.5px] mr-1.5"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
        >
          {value}
        </Text>
      )}
      {interactive && <ChevronIcon stroke={chevronStroke} />}
    </View>
  );

  return (
    <View>
      {interactive ? <Pressable onPress={onPress}>{Inner}</Pressable> : Inner}
      {showDivider && <View className="h-[1px] bg-border ml-[60px]" />}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons — small line glyphs reused across the drawer
//
// Every icon accepts its stroke color via prop so the drawer can
// pass the active `colors.ink` (or `colors.inkSubtle` for chevrons)
// from a single `useColors()` call at the top of ProfileScreen. We
// thread the color explicitly rather than calling `useColors()`
// inside each icon to keep React's re-render set small — these
// icons are rendered 10+ times per drawer and don't need their
// own subscription to the theme.
// ─────────────────────────────────────────────────────────────────

type IconProps = { stroke: string };

/**
 * Compute the right-hand value shown next to "Study sessions" in
 * the drawer. Mirrors the "On / Off" pattern used by Focus mode but
 * carries a slightly richer signal: "None" when there are zero
 * sessions, the count when there's more than one, and the single
 * session's time when there's exactly one (so the most common case
 * — one morning study — shows the user their commitment at a
 * glance without having to open the screen).
 */
function studySessionsRowValue(
  sessions: ReadonlyArray<{
    enabled: boolean;
    time: { hour: number; minute: number };
  }>,
): string {
  const active = sessions.filter((s) => s.enabled);
  if (sessions.length === 0) return "None";
  if (sessions.length === 1) {
    const only = sessions[0];
    if (!only.enabled) return "Paused";
    const h = only.time.hour;
    const m = only.time.minute;
    const period = h < 12 ? "AM" : "PM";
    const display = h % 12 === 0 ? 12 : h % 12;
    return `${display}:${String(m).padStart(2, "0")} ${period}`;
  }
  if (active.length === 0) return "All paused";
  return `${active.length} active`;
}

const ICON_BASE = {
  strokeWidth: 1.7,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function FlameIcon({
  active,
  stroke,
}: {
  active: boolean;
  stroke: string;
}) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M12 3c2 3 5 5 5 9a5 5 0 11-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-8z"
        fill={active ? "#FFB672" : "none"}
        stroke={active ? "#FFB672" : stroke}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RhythmIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M5 20V13M12 20V8M19 20V4" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function UserIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M12 12a4 4 0 100-8 4 4 0 000 8z" {...ICON_BASE} stroke={stroke} />
      <Path d="M4 21c0-4 4-7 8-7s8 3 8 7" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function MailIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M3 6h18v12H3z" {...ICON_BASE} stroke={stroke} />
      <Path d="M3 7l9 7 9-7" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function BellIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M18 16v-5a6 6 0 10-12 0v5l-2 2h16zM10 20a2 2 0 004 0"
        {...ICON_BASE}
        stroke={stroke}
      />
    </Svg>
  );
}

function TargetIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" {...ICON_BASE} stroke={stroke} />
      <Path d="M12 16a4 4 0 100-8 4 4 0 000 8z" {...ICON_BASE} stroke={stroke} />
      <Path d="M12 13a1 1 0 100-2 1 1 0 000 2z" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function MoonIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M20 14.5A8 8 0 119.5 4 7 7 0 0020 14.5z" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function BookIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M4 5h6a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-6a2 2 0 00-2 2v12a2 2 0 012-2h6z"
        {...ICON_BASE}
        stroke={stroke}
      />
    </Svg>
  );
}

function ShieldRowIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M12 3l8 3v6c0 4-3 7-8 9-5-2-8-5-8-9V6l8-3z"
        {...ICON_BASE}
        stroke={stroke}
      />
    </Svg>
  );
}

/**
 * Calendar-with-a-bookmark icon — visually distinct from BookIcon
 * (open book) and ClockIcon (round face) so the row reads as
 * "scheduled study time" at a glance rather than a generic
 * notifications/clock icon.
 */
function StudyIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M4 7h16v12H4zM4 7V5a1 1 0 011-1h14a1 1 0 011 1v2"
        {...ICON_BASE}
        stroke={stroke}
      />
      <Path
        d="M8 3v4M16 3v4"
        {...ICON_BASE}
        stroke={stroke}
      />
      <Path
        d="M9 12h6M9 15h4"
        {...ICON_BASE}
        stroke={stroke}
      />
    </Svg>
  );
}

function HeartIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"
        {...ICON_BASE}
        stroke={stroke}
      />
    </Svg>
  );
}

function DocIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M6 3h9l5 5v13H6z" {...ICON_BASE} stroke={stroke} />
      <Path d="M14 3v6h6" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function InfoIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" {...ICON_BASE} stroke={stroke} />
      <Path d="M12 11v6M12 7.5v.5" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function NoteRowIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M5 4h10l4 4v12H5z" {...ICON_BASE} stroke={stroke} />
      <Path d="M14 4v5h5M8 14h8M8 18h5" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function HighlightRowIcon({ stroke }: IconProps) {
  // A stylized "marker" — diagonal pen with a thick highlighted
  // underline so the icon evokes the action even at this tiny size.
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M4 19l4 1 9-9-5-5-9 9z" {...ICON_BASE} stroke={stroke} />
      <Path d="M13 6l5 5" {...ICON_BASE} stroke={stroke} />
      <Path
        d="M4 22h16"
        stroke="#FFB672"
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function ChevronIcon({ stroke }: IconProps) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Human-readable label for the Appearance row in the drawer.
 * Matches the row that's actually selected on the Appearance
 * screen so the drawer and the screen never disagree.
 */
const APPEARANCE_LABEL: Record<ThemePref, string> = {
  system: "Auto",
  dark: "Dark",
  light: "Light",
};
