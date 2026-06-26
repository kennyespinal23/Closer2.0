import { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { SFSymbol } from "@/components/Symbol";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import {
  SettingsInfoBanner,
  SettingsLinkRow,
  SettingsSection,
  SettingsStaticRow,
} from "@/components/SettingsScaffold";
import * as haptics from "@/lib/haptics";
import {
  formatRef,
  relativeTime,
  routeForVerse,
} from "@/lib/annotationsFormat";
import { findMomentByDay, resolveSermonType } from "@/lib/moments";
import {
  type Highlight,
  type Note,
  useAnnotations,
} from "@/state/annotations";
import { useOnboarding } from "@/state/onboarding";
import { useDevAppReset } from "@/lib/useDevAppReset";
import { isInternalBuild } from "@/lib/isInternalBuild";
import { useDevTools } from "@/state/devTools";
import { useMoments } from "@/state/moments";
import { useSavedSermons } from "@/state/savedSermons";
import {
  useColors,
  useResolvedScheme,
  useTheme,
  type ThemePref,
} from "@/state/theme";

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
  const { allNotes, allHighlights, counts: annotationCounts } =
    useAnnotations();
  const { saved: savedSermonDays, count: savedCount } = useSavedSermons();
  const { todaysMoment, catalogPosition, advanceToNextMoment } = useMoments();
  const { enabled: devToolsEnabled } = useDevTools();
  const showDevShortcuts = isInternalBuild() || devToolsEnabled;
  const { resetApp, restartApp } = useDevAppReset();
  const colors = useColors();
  const { pref: themePref } = useTheme();

  const firstName = (answers.name || "").trim().split(" ")[0] || "Friend";
  const appearanceValue = APPEARANCE_LABEL[themePref];

  // Newest-first slices. We render at most 3 previews of each so
  // the page stays scannable; the "See all" link routes to the
  // dedicated list view for the long tail.
  const recentNotes = allNotes().slice(0, 3);
  const recentHighlights = allHighlights().slice(0, 3);

  // Resolve the user's most recently saved sermons to renderable
  // moment+type pairs. Saved sermons used to live as a horizontal
  // rail on the Library tab; design review (June 2026) moved them
  // here because once a user intentionally saves something it
  // stops being "browsable content" and becomes a personal artifact
  // alongside Notes and Highlights. The catalog can drop entries
  // between content releases, so we filter out any saved day that
  // no longer resolves — protecting against ghost rows.
  const recentSavedSermons = useMemo(() => {
    return savedSermonDays
      .slice(0, 3)
      .map((day) => {
        const moment = findMomentByDay(day);
        if (!moment) return null;
        return { moment, type: resolveSermonType(moment.type) };
      })
      .filter(
        (
          x,
        ): x is {
          moment: NonNullable<ReturnType<typeof findMomentByDay>>;
          type: ReturnType<typeof resolveSermonType>;
        } => x !== null,
      );
  }, [savedSermonDays]);

  // The hero stat strip is the spiritual-journey snapshot — three
  // columns of personal artifacts the user has accumulated, all of
  // them matching the content sections directly beneath the card so
  // the trio reads as a legend rather than a separate scoreboard:
  //
  //   • Saved      — sermons the user has tapped Save on (whole
  //                  pieces they wanted to keep)
  //   • Highlights — verses the user has marked as meaningful
  //   • Reflections— notes the user has written from scripture
  //
  // Stat ordering mirrors the section ordering below: Saved →
  // Highlights → Notes. Previously this trio was Days with God /
  // Reflections / Highlights — design review (June 2026) replaced
  // the cadence metric (Days with God) with Saved so the entire
  // card stays inside one consistent mental model: things you've
  // collected. Cadence/streak data still lives on the Rhythm
  // detail screen where it belongs.
  const notesCount = annotationCounts.notes;
  const highlightsCount = annotationCounts.highlights;

  const navigateTo = (href: Href) => {
    haptics.soft();
    router.push(href);
  };

  const handleAdvanceSermon = () => {
    haptics.soft();
    advanceToNextMoment();
    router.navigate("/today");
  };

  const confirmResetApp = () => {
    Alert.alert(
      "Reset app?",
      "Wipes all persisted state and returns to the welcome screen — like a fresh install. There's no undo.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            haptics.soft();
            resetApp();
          },
        },
      ],
    );
  };

  const confirmRestartApp = () => {
    Alert.alert(
      "Restart app?",
      "Wipes everything and jumps straight into onboarding — useful when iterating on the welcome flow.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restart",
          style: "destructive",
          onPress: () => {
            haptics.soft();
            restartApp();
          },
        },
      ],
    );
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
            paddingTop: 4,
            paddingBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              color: colors.ink,
              fontSize: 32,
              lineHeight: 38,
              letterSpacing: -0.6,
            }}
            accessibilityRole="header"
          >
            My Profile
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
            Identity surface — avatar + name + the journey-stat
            strip. Trimmed down from the prior revision per design
            review: the "Drawing nearer, one day at a time" /
            "Honored today · drawing nearer" subtitle was removed
            (flagged as decorative AI-generated copy that Apple
            generally avoids), and the avatar + padding are dialled
            back a notch so the card's footprint matches the
            information it carries.
            
            The stat strip beneath reads as a spiritual-journey
            snapshot — Days with God / Reflections / Highlights —
            rather than the previous Day streak / Longest /
            Sermons engagement triplet, so the card ties directly
            into the Notes + Highlights sections it sits above. */}
        <View style={{ paddingHorizontal: 16 }}>
          <View
            style={{
              borderRadius: 26,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              paddingTop: 20,
              paddingHorizontal: 16,
              paddingBottom: 16,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.accentSoft,
                borderWidth: 2,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: "System",
                  fontWeight: "700",
                  color: colors.primary,
                  fontSize: 28,
                  letterSpacing: -0.5,
                }}
              >
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "700",
                color: colors.ink,
                fontSize: 22,
                lineHeight: 26,
                letterSpacing: -0.4,
              }}
              numberOfLines={1}
            >
              {firstName}
            </Text>

            {/* Stat strip — 3 columns separated by hairline rules.
                Reframed as spiritual-journey artifacts (see the
                top-of-component data block for the full rationale):
                cadence, written reflections, marked scriptures.
                Same shape as before so the visual rhythm of the
                card is preserved — only the meaning changed. */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "stretch",
                marginTop: 20,
                paddingTop: 16,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: colors.border,
                alignSelf: "stretch",
              }}
            >
              <HeroStat
                value={String(savedCount)}
                label={savedCount === 1 ? "Saved" : "Saved"}
              />
              <HeroStatDivider />
              <HeroStat
                value={String(highlightsCount)}
                label={highlightsCount === 1 ? "Highlight" : "Highlights"}
              />
              <HeroStatDivider />
              <HeroStat
                value={String(notesCount)}
                label={notesCount === 1 ? "Reflection" : "Reflections"}
              />
            </View>
          </View>
        </View>

        {/* ─── Saved sermons (personal-artifact preview) ────────
            Moved here from the Library tab in June 2026 per
            design review: a sermon stops being "browsable
            content" the moment a user intentionally taps Save,
            so it belongs alongside Notes and Highlights as a
            personal artifact rather than competing for attention
            in the discovery surface.
            
            Newest 3 inline; each row routes to the dedicated
            saved-sermon reader at /saved-sermon/[day]. No
            "See all" link yet — when users start accumulating
            more than a handful of saves we'll ship a dedicated
            /saved-sermons index screen, mirroring the /notes
            and /highlights pattern.
            
            Sits first in the artifact triad (Saved → Highlights
            → Notes) because saved sermons are the largest unit
            — whole pieces — and that ordering matches the hero
            stat strip above for visual symmetry. */}
        {/* No `onSeeAll` — Saved Sermons doesn't have a dedicated
            index screen yet (Notes/Highlights do). When we ship
            /saved-sermons we'll wire this; until then the count
            badge alone hints at scope and individual rows remain
            tappable. */}
        <SectionHeader
          title="Saved sermons"
          count={savedCount}
          ink={colors.ink}
          inkSubtle={colors.inkSubtle}
        />
        {recentSavedSermons.length === 0 ? (
          <ProfileEmptyCard
            title="No saved sermons yet"
            body="Tap Save on the closing screen of any sermon to keep it here for re-reading."
          />
        ) : (
          <View className="px-6 mt-2 gap-2">
            {recentSavedSermons.map(({ moment, type }) => (
              <ProfileSavedSermonRow
                key={moment.day}
                title={moment.title}
                typeName={type.name}
                accent={type.accent}
                onPress={() => navigateTo(`/saved-sermon/${moment.day}` as Href)}
              />
            ))}
          </View>
        )}

        {/* ─── Highlights (Imprint-style preview) ───────────────
            Newest 3 inline, "See all" link to the dedicated
            screen. Highlights here render with the user's chosen
            highlight color as the lead accent (left bar) so the
            preview carries the personal annotation aesthetic
            instead of being indistinguishable from the notes
            section beneath. Sits second in the artifact triad
            (after Saved sermons, before Notes) because verses
            are the second-largest unit — single passages
            claimed as meaningful. */}
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
                key={highlight.key}
                highlight={highlight}
                onPress={() => navigateTo(routeForVerse(highlight))}
              />
            ))}
          </View>
        )}

        {/* ─── Notes (Imprint-style preview) ────────────────────
            Imprint surfaces your "Reflections" on the profile
            page as a stack of recent cards — not as a single
            nav row. The previous drawer's NavRow("Notes", "12")
            communicated "12 notes exist somewhere" but didn't
            actually show you any. This preview lists the newest
            3 notes inline; tap a card to open the verse the
            note is anchored to, or tap "See all" to drill into
            the full /notes screen.
            
            Sits third in the artifact triad — the smallest unit
            (a verse-anchored personal sentence) but the deepest
            (your own writing). Empty state matters here — an
            empty list reads as "nothing yet" which would feel
            hollow next to populated stat cards above. We render
            an inviting empty state ("No notes yet — start
            with…") so the section still feels alive on day one. */}
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

        {/* Account / Preferences / About — routed through the
            SHARED SettingsSection + SettingsLinkRow primitives
            (instead of profile-local duplicates) so the cells
            inherit the same iOS-Settings polish the settings
            detail pages got: filled-circle back chip, divider
            inset adapting to the icon column, and the iOS-blue
            checkmark variant if any picker rows are added later.
            Removing the duplicates also keeps a single source of
            truth for row typography — earlier profile rows were
            drifting (14pt vs 14.5pt, py-3 vs py-3.5) which made
            this surface feel slightly different from the rest of
            the settings stack. */}
        <SettingsSection title="Account">
          <SettingsLinkRow
            icon={<UserIcon stroke={colors.ink} />}
            label="Your name"
            value={firstName}
            onPress={() => navigateTo("/settings/name")}
            showDivider
          />
          <SettingsLinkRow
            icon={<MailIcon stroke={colors.ink} />}
            label="Email"
            value="Not signed in"
            onPress={() => navigateTo("/settings/account")}
          />
        </SettingsSection>

        {/* Preferences trimmed to the rows that don't already
            have a primary home elsewhere in the app:
              • Reading goal → deferred to v2
              • Bible version → set inline on the bible reader
                screen (per-passage translation picker)
              • Focus mode + App blocks → live on the home page
                (the App Blocks list / per-block toggles), so
                duplicating them under Preferences gave the same
                feature two entry points and made the surface
                drift over time.
            What remains: notification cadence + light/dark
            appearance — the two preferences that genuinely
            belong in a global settings list. */}
        <SettingsSection title="Preferences">
          <SettingsLinkRow
            icon={<BellIcon stroke={colors.ink} />}
            label="Notifications"
            value="Manage"
            onPress={() => navigateTo("/settings/notifications")}
            showDivider
          />
          <SettingsLinkRow
            icon={<MoonIcon stroke={colors.ink} />}
            label="Appearance"
            value={appearanceValue}
            onPress={() => navigateTo("/settings/appearance")}
          />
        </SettingsSection>

        {/* Encouragement card — now uses the shared
            SettingsInfoBanner primitive (neutral tone) so the
            framing card matches the rest of the settings surface
            stylistically, instead of being a one-off inline
            <View> + <Text> with bespoke padding. Lives in the
            mid-page rhythm between Preferences and About as
            quiet glue. */}
        <SettingsInfoBanner
          title="You're building something quiet."
          body="Every sermon completed is a small turn of the heart toward Him."
        />

        {showDevShortcuts ? (
          <SettingsSection
            title="Developer"
            footer="Internal QA only. Reset and Restart wipe every provider on disk — progress, notes, focus sessions, reminders — then route to a fresh entry."
          >
            <SettingsLinkRow
              icon={
                <SFSymbol
                  name="forward.fill"
                  size={14}
                  color={colors.ink}
                  weight="semibold"
                />
              }
              label="Next sermon"
              sublabel={todaysMoment.title}
              value={`${catalogPosition.position} / ${catalogPosition.total}`}
              onPress={handleAdvanceSermon}
              showDivider
            />
            <SettingsLinkRow
              icon={
                <SFSymbol
                  name="arrow.counterclockwise"
                  size={14}
                  color="#FF6B6B"
                  weight="semibold"
                />
              }
              label="Reset app"
              sublabel="Fresh install — welcome screen"
              onPress={confirmResetApp}
              destructive
              showDivider
            />
            <SettingsLinkRow
              icon={
                <SFSymbol
                  name="power"
                  size={14}
                  color="#FF6B6B"
                  weight="semibold"
                />
              }
              label="Restart app"
              sublabel="Fresh install — straight into onboarding"
              onPress={confirmRestartApp}
              destructive
            />
          </SettingsSection>
        ) : null}

        <SettingsSection title="About">
          <SettingsLinkRow
            icon={<HeartIcon stroke={colors.ink} />}
            label="Help & support"
            onPress={() => navigateTo("/settings/help")}
            showDivider
          />
          <SettingsLinkRow
            icon={<DocIcon stroke={colors.ink} />}
            label="Privacy"
            onPress={() => navigateTo("/settings/privacy")}
            showDivider
          />
          {/* Developer Tools — same gate as before: visible to
              everyone today, hidden behind a Settings toggle once
              we ship to non-internal users. See the legacy
              drawer for the historical reasoning. */}
          <SettingsLinkRow
            icon={<CodeIcon stroke={colors.ink} />}
            label="Developer Tools"
            onPress={() => navigateTo("/settings/developer")}
            showDivider
          />
          {/* Version — informational only. SettingsStaticRow
              renders the same icon + label + value shape WITHOUT
              the trailing chevron, so the row honestly reads as
              "here's a fact" rather than promising a navigation
              destination. Apple's Settings does the same for
              Version, Build Number, Serial Number, etc. */}
          <SettingsStaticRow
            icon={<InfoIcon stroke={colors.ink} />}
            label="Version"
            value="0.1.0"
          />
        </SettingsSection>
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
  /**
   * Optional — when provided, renders a trailing "See all" link
   * that routes to the section's dedicated index screen. Omit
   * the prop for sections that don't yet have an index page
   * (e.g. Saved Sermons today); the header still shows the count
   * badge so the user understands the scope, just without a
   * dead chevron to nowhere.
   */
  onSeeAll?: () => void;
  ink: string;
  inkSubtle: string;
}) {
  const scheme = useResolvedScheme();
  // iOS systemBlue — Apple's canonical "navigation accent" used
  // for every "See All" / "Show More" / "View All" affordance in
  // App Store sections, Music shelves, News topic cards. Using
  // the same tint here ties the Profile-page artifact previews
  // (Saved sermons / Highlights / Notes) into the same iOS-native
  // navigation language the settings surface uses for inline
  // links, so the user encounters one consistent "tap to drill
  // in" color across the app.
  const blue = scheme === "light" ? "#007AFF" : "#0A84FF";
  return (
    <View
      className="px-6 flex-row items-end justify-between"
      style={{ marginTop: 32 }}
    >
      <View className="flex-row items-baseline">
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "700",
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
              fontFamily: "System",
              fontWeight: "600",
              color: inkSubtle,
              fontSize: 14,
              marginLeft: 8,
            }}
          >
            {count}
          </Text>
        ) : null}
      </View>
      {count > 0 && onSeeAll ? (
        <Pressable
          hitSlop={10}
          onPress={onSeeAll}
          accessibilityRole="link"
          accessibilityLabel={`See all ${title.toLowerCase()}`}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "600",
              color: blue,
              fontSize: 14,
              letterSpacing: -0.1,
              marginRight: 2,
            }}
          >
            See All
          </Text>
          <SFSymbol
            name="chevron.right"
            size={11}
            color={blue}
            weight="semibold"
          />
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
          paddingVertical: 16,
        }}
      >
        <View className="flex-row items-baseline justify-between">
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
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
              fontFamily: "System",
              fontWeight: "500",
              color: colors.inkSubtle,
              fontSize: 11.5,
            }}
          >
            {relativeTime(note.updatedAt || note.createdAt)}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "500",
            color: colors.ink,
            fontSize: 14,
            lineHeight: 19,
            marginTop: 4,
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
          paddingVertical: 16,
          flexDirection: "row",
        }}
      >
        <View
          style={{
            width: 3,
            borderRadius: 2,
            backgroundColor: accent,
            marginRight: 16,
            alignSelf: "stretch",
          }}
        />
        <View style={{ flex: 1 }}>
          <View className="flex-row items-baseline justify-between">
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "700",
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
                fontFamily: "System",
                fontWeight: "500",
                color: colors.inkSubtle,
                fontSize: 11.5,
              }}
            >
              {relativeTime(highlight.updatedAt)}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "400",
              color: colors.inkMuted,
              fontSize: 13.5,
              lineHeight: 19,
              marginTop: 4,
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
// ProfileSavedSermonRow — compact saved-sermon preview on the
// profile tab.
//
// Mirrors the shape of the highlight row above (left-edge accent
// ribbon in the sermon type's color + uppercase type eyebrow +
// sermon title) so the three artifact sections (Saved Sermons /
// Highlights / Notes) share a single visual vocabulary. The
// ribbon does double duty: it nods to the type's color world
// without requiring a hero illustration in the row, and visually
// links the card to the SavedSermonCard that USED to live on the
// Library tab (same left-edge accent stripe) so users who learned
// the Library rail recognize this preview immediately.
//
// Tap routes to /saved-sermon/[day] — the same destination the
// old Library rail used, so no other surface in the app needs to
// know the section moved.
// ─────────────────────────────────────────────────────────────────

function ProfileSavedSermonRow({
  title,
  typeName,
  accent,
  onPress,
}: {
  title: string;
  typeName: string;
  accent: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open saved sermon ${title}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
          paddingVertical: 16,
          flexDirection: "row",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: 3,
            borderRadius: 2,
            backgroundColor: accent,
            marginRight: 16,
            alignSelf: "stretch",
          }}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              color: accent,
              fontSize: 11,
              letterSpacing: 1.6,
              textTransform: "uppercase",
            }}
            numberOfLines={1}
          >
            {typeName}
          </Text>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              color: colors.ink,
              fontSize: 15.5,
              lineHeight: 20,
              letterSpacing: -0.2,
              marginTop: 6,
            }}
            numberOfLines={2}
          >
            {title}
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
            fontFamily: "System",
            fontWeight: "600",
            color: colors.ink,
            fontSize: 14,
            lineHeight: 18,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "400",
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
          fontFamily: "System",
          fontWeight: "700",
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
          fontFamily: "System",
          fontWeight: "600",
          color: colors.inkSubtle,
          fontSize: 11,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          marginTop: 4,
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
// Section / Row — REMOVED. The Profile tab previously declared
// its own `Section` + `Row` primitives that duplicated the shape
// of SettingsSection + SettingsLinkRow with subtly different
// typography (14pt vs 14.5pt label, py-3 vs py-3.5 vertical
// padding, fixed 60pt divider inset). Routing through the shared
// components means:
//   • One source of truth for cell typography across every
//     settings-style surface in the app.
//   • Profile inherits the icon-aware divider inset that lands
//     dividers at the label's leading edge whether or not a row
//     has an icon column (matches the iOS Settings pattern).
//   • Any future polish to the shared row (e.g. iOS-blue active
//     states, swipe actions) lights up here for free.
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

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

function HeartIcon({ stroke }: IconProps) {
  return <SFSymbol name="heart" size={14} color={stroke} weight="medium" />;
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
