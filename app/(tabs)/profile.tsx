import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import * as haptics from "@/lib/haptics";
import {
  formatRef,
  relativeTime,
  routeForVerse,
} from "@/lib/annotationsFormat";
import {
  type Highlight,
  type Note,
  useAnnotations,
} from "@/state/annotations";
import { useFocus } from "@/state/focus";
import { useOnboarding } from "@/state/onboarding";
import { usePreferences } from "@/state/preferences";
import { didCompleteToday, useProgress } from "@/state/progress";
import { useReadingGoal } from "@/state/readingGoal";
import { useStudySessions } from "@/state/studySessions";
import { useColors, useTheme, type ThemePref } from "@/state/theme";

/**
 * Profile tab — the third tab in the consolidated Home / Library /
 * Profile shell.
 *
 * Previously profile was a left-side drawer launched from the home
 * avatar. The user collapsed the Practice + Insights + Check-in
 * cells out of the tab bar, asked for a 3-tab shell, and asked
 * for Notes and Highlights to live ON the profile page directly
 * (Imprint-style) instead of being one tap away as nav rows.
 *
 * Page shape (top → bottom):
 *
 *   1. Identity strip (avatar + name + tagline)
 *   2. Stat cards (Today / Sermons)
 *   3. Notes preview (newest 3, "See all" → /notes)
 *   4. Highlights preview (newest 3, "See all" → /highlights)
 *   5. Account section
 *   6. Preferences section
 *   7. Soft promo card
 *   8. About section
 *
 * The avatar at the top of the home page now navigates to this tab
 * (instead of opening the legacy drawer); both surfaces converge
 * into the same single profile view.
 */
export default function ProfileTabScreen() {
  const router = useRouter();
  const { answers } = useOnboarding();
  const { totalCompletions } = useProgress();
  const progress = useProgress();
  const { translation } = usePreferences();
  const { allNotes, allHighlights, counts: annotationCounts } =
    useAnnotations();
  const { goalMinutes: readingGoalMinutes } = useReadingGoal();
  const { prefs: focusPrefs } = useFocus();
  const { sessions: studySessions } = useStudySessions();
  const colors = useColors();
  const { pref: themePref } = useTheme();

  const firstName = (answers.name || "").trim().split(" ")[0] || "Friend";
  const honoredToday = didCompleteToday(progress);
  const appearanceValue = APPEARANCE_LABEL[themePref];

  // Newest-first slices. We render at most 3 previews of each so
  // the page stays scannable; the "See all" link routes to the
  // dedicated list view for the long tail.
  const recentNotes = allNotes().slice(0, 3);
  const recentHighlights = allHighlights().slice(0, 3);

  // The hero stat strip uses three derived numbers:
  //   • current streak in days (today's commitment)
  //   • longest streak ever (lifetime record)
  //   • total sermons completed (lifetime engagement)
  // These three together carry the same shape as the reference's
  // STREAK / COMPLETED / XP triplet without inventing an XP system
  // — the user gets one running commitment, one personal best, and
  // one lifetime tally.
  const currentStreak = progress.streak?.current ?? 0;
  const longestStreak = progress.streak?.longest ?? 0;

  const navigateTo = (href: Href) => {
    haptics.soft();
    router.push(href);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top chrome ───────────────────────────────────────
            "Me" title on the left + a quiet settings gear on the
            right. The gear is a stand-in for the reference's
            Settings chevron — taps land the user on the
            preferences index inside this screen (we just scroll
            them to the Preferences section since everything
            settings-shaped already lives below). The compact
            chrome row keeps the page's anchor minimal so the hero
            card immediately below feels like the page's content,
            not a stat appendage to a heavy header. */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 24,
            paddingTop: 2,
            paddingBottom: 18,
          }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.ink,
              fontSize: 32,
              lineHeight: 38,
              letterSpacing: -0.6,
            }}
            accessibilityRole="header"
          >
            Me
          </Text>
          <Pressable
            onPress={() => navigateTo("/settings/appearance")}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            hitSlop={10}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.accentSoft,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <GearIcon stroke={colors.ink} />
          </Pressable>
        </View>

        {/* ─── Hero card ────────────────────────────────────────
            Big rounded surface that mirrors the reference "Me"
            screen: an avatar circle anchored centered at the
            top, the user's name immediately below, a quiet
            tagline (in place of the reference's "Level 1:
            Learner"), and a three-up stat strip pinned at the
            bottom. The whole card is one surface — no internal
            dividers other than the thin separators between the
            stat columns — so it reads as a single block of
            personal identity. */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              borderRadius: 26,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              paddingTop: 22,
              paddingHorizontal: 18,
              paddingBottom: 18,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: colors.accentSoft,
                borderWidth: 2,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: colors.primary,
                  fontSize: 32,
                  letterSpacing: -0.5,
                }}
              >
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: colors.ink,
                fontSize: 22,
                lineHeight: 26,
                letterSpacing: -0.4,
              }}
              numberOfLines={1}
            >
              {firstName}
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_500Medium",
                color: colors.inkSubtle,
                fontSize: 13.5,
                lineHeight: 18,
                marginTop: 4,
              }}
              numberOfLines={1}
            >
              {honoredToday
                ? "Honored today · drawing nearer"
                : "Drawing nearer, one day at a time"}
            </Text>

            {/* Stat strip — 3 columns separated by hairline rules.
                Numbers ride at 22pt Bold so they read as the page's
                identity scoreboard; labels sit underneath in tight
                uppercase to mirror the reference's "LONGEST STREAK
                · LESSONS COMPLETED · TOTAL XP" treatment. */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "stretch",
                marginTop: 22,
                paddingTop: 18,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: colors.border,
                alignSelf: "stretch",
              }}
            >
              <HeroStat value={String(currentStreak)} label="Day streak" />
              <HeroStatDivider />
              <HeroStat value={String(longestStreak)} label="Longest" />
              <HeroStatDivider />
              <HeroStat
                value={String(totalCompletions)}
                label={totalCompletions === 1 ? "Sermon" : "Sermons"}
              />
            </View>
          </View>
        </View>

        {/* ─── Notes (Imprint-style preview) ────────────────────
            Imprint surfaces your "Reflections" on the profile
            page as a stack of recent cards — not as a single
            nav row. The previous drawer's NavRow("Notes", "12")
            communicated "12 notes exist somewhere" but didn't
            actually show you any. This preview lists the newest
            3 notes inline; tap a card to open the verse the
            note is anchored to, or tap "See all" to drill into
            the full /notes screen.
            
            Empty state matters here — an empty list reads as
            "nothing yet" which would feel hollow next to
            populated stat cards above. We render an inviting
            empty state ("No notes yet — start with…") so the
            section still feels alive on day one. */}
        <SectionHeader
          title="Notes"
          count={annotationCounts.notes}
          onSeeAll={() => navigateTo("/notes")}
          ink={colors.ink}
          inkSubtle={colors.inkSubtle}
        />
        {recentNotes.length === 0 ? (
          <ProfileEmptyCard
            title="No notes yet"
            body="Write your first reflection from any verse — long-press to open the menu."
          />
        ) : (
          <View className="px-6 mt-2 gap-2">
            {recentNotes.map((note) => (
              <ProfileNoteRow
                key={note.noteId}
                note={note}
                onPress={() => navigateTo(routeForVerse(note))}
              />
            ))}
          </View>
        )}

        {/* ─── Highlights (Imprint-style preview) ───────────────
            Same pattern as Notes — newest 3 inline, "See all"
            link to the dedicated screen. Highlights here render
            with the user's chosen highlight color as the lead
            accent (left bar) so the preview carries the
            personal annotation aesthetic instead of being
            indistinguishable from the notes section above. */}
        <SectionHeader
          title="Highlights"
          count={annotationCounts.highlights}
          onSeeAll={() => navigateTo("/highlights")}
          ink={colors.ink}
          inkSubtle={colors.inkSubtle}
        />
        {recentHighlights.length === 0 ? (
          <ProfileEmptyCard
            title="No highlights yet"
            body="Long-press any verse to mark it — your highlights collect here."
          />
        ) : (
          <View className="px-6 mt-2 gap-2">
            {recentHighlights.map((highlight) => (
              <ProfileHighlightRow
                key={`${highlight.book}-${highlight.chapter}-${highlight.verse}-${highlight.createdAt}`}
                highlight={highlight}
                onPress={() => navigateTo(routeForVerse(highlight))}
              />
            ))}
          </View>
        )}

        {/* ─── Account ──────────────────────────────────────── */}
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

        {/* ─── Preferences ──────────────────────────────────── */}
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
            label="App blocks"
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
          {/* Developer Tools — same gate as before: visible to
              everyone today, hidden behind a Settings toggle once
              we ship to non-internal users. See the legacy
              drawer for the historical reasoning. */}
          <Row
            icon={<CodeIcon stroke={colors.ink} />}
            label="Developer Tools"
            interactive
            chevronStroke={colors.inkSubtle}
            onPress={() => navigateTo("/settings/developer")}
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
  );
}

// ─────────────────────────────────────────────────────────────────
// SectionHeader — Apple-app style header for inline previews
//
// Used for the "Notes" and "Highlights" preview sections that
// surface recent content directly on the profile page (Imprint
// pattern). The header carries:
//   • the section title (24pt bold, ink color)
//   • a count badge (when > 0)
//   • a "See all" link to the dedicated screen
//
// Distinct from `Section` below — `Section` wraps a list of
// settings rows in a card. SectionHeader leaves the body free for
// custom content (note cards, highlight cards, etc).
// ─────────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
  onSeeAll,
  ink,
  inkSubtle,
}: {
  title: string;
  count: number;
  onSeeAll: () => void;
  ink: string;
  inkSubtle: string;
}) {
  return (
    <View
      className="px-6 flex-row items-end justify-between"
      style={{ marginTop: 28 }}
    >
      <View className="flex-row items-baseline">
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: ink,
            fontSize: 22,
            lineHeight: 26,
            letterSpacing: -0.5,
          }}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {count > 0 ? (
          <Text
            style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              color: inkSubtle,
              fontSize: 14,
              marginLeft: 8,
            }}
          >
            {count}
          </Text>
        ) : null}
      </View>
      {count > 0 ? (
        <Pressable
          hitSlop={10}
          onPress={onSeeAll}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              color: inkSubtle,
              fontSize: 13.5,
            }}
          >
            See all
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// ProfileNoteRow — compact note preview shown on the profile tab
//
// Surfaces the verse reference, a one-line slice of the note body,
// and a relative timestamp. Tapping the row routes to the verse the
// note is anchored to — the same target as the dedicated /notes
// screen, so the affordance is consistent across surfaces.
// ─────────────────────────────────────────────────────────────────

function ProfileNoteRow({
  note,
  onPress,
}: {
  note: Note;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <View className="flex-row items-baseline justify-between">
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.ink,
              fontSize: 11,
              letterSpacing: 1.6,
              textTransform: "uppercase",
            }}
          >
            {formatRef(note)}
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_500Medium",
              color: colors.inkSubtle,
              fontSize: 11.5,
            }}
          >
            {relativeTime(note.updatedAt || note.createdAt)}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_500Medium",
            color: colors.ink,
            fontSize: 14,
            lineHeight: 19,
            marginTop: 6,
          }}
          numberOfLines={2}
        >
          {note.text}
        </Text>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// ProfileHighlightRow — compact highlight preview shown on profile
//
// Visually distinguished from notes by a left-edge accent bar in
// the user's chosen highlight color. The verse text reads as the
// body so the highlight feels like a captured moment in scripture
// rather than a generic list row.
// ─────────────────────────────────────────────────────────────────

function ProfileHighlightRow({
  highlight,
  onPress,
}: {
  highlight: Highlight;
  onPress: () => void;
}) {
  const colors = useColors();
  // Accent bar uses the saved highlight color's swatch — gives
  // the user's chosen color a presence in the preview without
  // washing the verse text in tint (we render verseText in
  // muted ink instead so the row reads as a Closer surface,
  // not a literal scripture screen). Fallback to warm amber if
  // the saved color object is somehow missing.
  const accent = highlight.color?.swatch ?? "#FFB672";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: "row",
        }}
      >
        <View
          style={{
            width: 3,
            borderRadius: 2,
            backgroundColor: accent,
            marginRight: 12,
            alignSelf: "stretch",
          }}
        />
        <View style={{ flex: 1 }}>
          <View className="flex-row items-baseline justify-between">
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: colors.ink,
                fontSize: 11,
                letterSpacing: 1.6,
                textTransform: "uppercase",
              }}
            >
              {formatRef(highlight)}
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_500Medium",
                color: colors.inkSubtle,
                fontSize: 11.5,
              }}
            >
              {relativeTime(highlight.updatedAt)}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              color: colors.inkMuted,
              fontSize: 13.5,
              lineHeight: 19,
              marginTop: 6,
              fontStyle: "italic",
            }}
            numberOfLines={2}
          >
            {highlight.verseText}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// ProfileEmptyCard — quiet invitation shown when a section has
// no content yet. Same surface as the populated rows so the page
// never visibly collapses to zero height in a section.
// ─────────────────────────────────────────────────────────────────

function ProfileEmptyCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const colors = useColors();
  return (
    <View className="px-6 mt-2">
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <Text
          style={{
            fontFamily: "PlusJakartaSans_600SemiBold",
            color: colors.ink,
            fontSize: 14,
            lineHeight: 18,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_400Regular",
            color: colors.inkMuted,
            fontSize: 12.5,
            lineHeight: 17,
            marginTop: 4,
          }}
        >
          {body}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// HeroStat — one column in the three-up stat strip at the bottom
// of the hero card. The reference's "1 LONGEST STREAK · 1 LESSONS
// COMPLETED · 50 TOTAL XP" pattern stacks the number on top in a
// generous weight and pins a small uppercase label beneath it.
// We follow the same shape: 22pt Bold value, 11pt tracking-1.4
// uppercase label, both centered inside an equal-width flex column.
// ─────────────────────────────────────────────────────────────────

function HeroStat({ value, label }: { value: string; label: string }) {
  const colors = useColors();
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          color: colors.ink,
          fontSize: 22,
          lineHeight: 26,
          letterSpacing: -0.4,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_600SemiBold",
          color: colors.inkSubtle,
          fontSize: 10.5,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          marginTop: 6,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * HeroStatDivider — slim vertical rule between stat columns.
 * The reference uses a hairline divider to separate the three
 * numbers. We match it: 1pt-equivalent vertical line in the page
 * border color, full height so it spans both the number and label
 * rows.
 */
function HeroStatDivider() {
  const colors = useColors();
  return (
    <View
      style={{
        width: StyleSheet.hairlineWidth,
        alignSelf: "stretch",
        backgroundColor: colors.border,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// Section — small-caps eyebrow + rounded card of settings rows
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

type RowProps = {
  icon: React.ReactNode;
  label: string;
  value?: string;
  interactive?: boolean;
  onPress?: () => void;
  showDivider?: boolean;
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
// Helpers
// ─────────────────────────────────────────────────────────────────

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

const APPEARANCE_LABEL: Record<ThemePref, string> = {
  system: "Auto",
  dark: "Dark",
  light: "Light",
};

// ─────────────────────────────────────────────────────────────────
// Icons — small line glyphs, color threaded through props so the
// component doesn't need its own `useColors()` subscription
// (mirrors the legacy drawer profile so the visual identity
// stays consistent across surfaces).
// ─────────────────────────────────────────────────────────────────

type IconProps = { stroke: string };

const ICON_BASE = {
  strokeWidth: 1.7,
  fill: "none" as const,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/**
 * GearIcon — the chrome-row affordance in the top-right of the
 * page. Mirrors the reference "Me" screen's settings cog, which
 * lives outside any list and acts as a quiet escape into the
 * deeper preferences. Sized to land in a 36pt rounded chip so
 * the tap target is comfortable without dominating the header.
 */
function GearIcon({ stroke }: IconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        {...ICON_BASE}
        stroke={stroke}
      />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 005 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 5a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09A1.65 1.65 0 0015 5a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019 9c.13.32.39.57.71.71"
        {...ICON_BASE}
        stroke={stroke}
      />
    </Svg>
  );
}

function UserIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M12 12a4 4 0 100-8 4 4 0 000 8z"
        {...ICON_BASE}
        stroke={stroke}
      />
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
      <Path
        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
        {...ICON_BASE}
        stroke={stroke}
      />
      <Path
        d="M12 16a4 4 0 100-8 4 4 0 000 8z"
        {...ICON_BASE}
        stroke={stroke}
      />
      <Path
        d="M12 13a1 1 0 100-2 1 1 0 000 2z"
        {...ICON_BASE}
        stroke={stroke}
      />
    </Svg>
  );
}

function MoonIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M20 14.5A8 8 0 119.5 4 7 7 0 0020 14.5z"
        {...ICON_BASE}
        stroke={stroke}
      />
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

function StudyIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M4 7h16v12H4zM4 7V5a1 1 0 011-1h14a1 1 0 011 1v2"
        {...ICON_BASE}
        stroke={stroke}
      />
      <Path d="M8 3v4M16 3v4" {...ICON_BASE} stroke={stroke} />
      <Path d="M9 12h6M9 15h4" {...ICON_BASE} stroke={stroke} />
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
      <Path
        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
        {...ICON_BASE}
        stroke={stroke}
      />
      <Path d="M12 11v6M12 7.5v.5" {...ICON_BASE} stroke={stroke} />
    </Svg>
  );
}

function CodeIcon({ stroke }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M8 9L4 12L8 15" {...ICON_BASE} stroke={stroke} />
      <Path d="M16 9L20 12L16 15" {...ICON_BASE} stroke={stroke} />
      <Path d="M14 5L10 19" {...ICON_BASE} stroke={stroke} />
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
