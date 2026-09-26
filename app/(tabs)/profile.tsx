import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { ProfileCollectionShelf } from "@/components/ProfileCollectionShelf";
import { ReaderNativeButton } from "@/components/ReaderNativeButton";
import { contentText, contentLayout } from "@/lib/contentStyles";
import { ProfileProgress } from "@/components/ProfileProgress";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { Image } from "expo-image";
import { SFSymbol } from "@/components/Symbol";
import { ReaderTutorial } from "@/components/ReaderTutorial";
import { BibleIntroScreen } from "@/components/BibleIntroScreen";
import { AvatarPickerSheet } from "@/components/AvatarPickerSheet";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import {
  SettingsInfoBanner,
  SettingsLinkRow,
  SettingsSection,
  SettingsStaticRow,
  SettingsToggleRow,
} from "@/components/SettingsScaffold";
import { findAvatar } from "@/constants/avatars";
import * as haptics from "@/lib/haptics";
import { SCREEN_H_PAD } from "@/lib/layout";
import { systemText } from "@/lib/typography";
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
import { useProgress } from "@/state/progress";
import { useDevAppReset } from "@/lib/useDevAppReset";
import { isInternalBuild } from "@/lib/isInternalBuild";
import { useDevTools } from "@/state/devTools";
import { useMoments } from "@/state/moments";
import { useSavedSermons } from "@/state/savedSermons";
import {
  advanceHomeQuotePreview,
  allHomeQuotes,
  clearHomeQuotePreview,
  getHomeQuotePreviewIndex,
  isHomeQuotePreviewActive,
  subscribeHomeQuotePreview,
} from "@/lib/homeQuotes";
import {
  useColors,
  useResolvedScheme,
  useTheme,
  type ThemePref,
} from "@/state/theme";
import { SkyGradient } from "@/components/HomeSkyGradient";

/** Profile hero avatar diameter — large enough to read as identity. */
const AVATAR_SIZE = 112;

/** Personal identity, progress, and collected artwork. */
export default function ProfileTabScreen() {
  const router = useRouter();
  const [savedTab, setSavedTab] = useState(0);
  const [savedExpanded, setSavedExpanded] = useState(false);
  const scheme = useResolvedScheme();
  const { answers, setAnswer } = useOnboarding();
  const { allNotes, allHighlights, counts: annotationCounts } =
    useAnnotations();
  const { saved: savedSermonDays, count: savedCount } = useSavedSermons();
  const {
    todaysMoment,
    catalogPosition,
    advanceToNextMoment,
    advanceToPreviousMoment,
    shuffleMoment,
  } = useMoments();
  const {
    enabled: devToolsEnabled,
    unlockAllMilestones,
    setUnlockAllMilestones,
  } = useDevTools();
  const showDevShortcuts = isInternalBuild() || devToolsEnabled;
  const { resetApp, restartApp } = useDevAppReset();
  const { streak } = useProgress();
  const colors = useColors();
  const { pref: themePref } = useTheme();
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [readerTutorialOpen, setReaderTutorialOpen] = useState(false);
  const [bibleIntroPreviewOpen, setBibleIntroPreviewOpen] = useState(false);
  const quoteCount = allHomeQuotes().length;
  const [quotePreview, setQuotePreview] = useState(() => ({
    active: isHomeQuotePreviewActive(),
    index: getHomeQuotePreviewIndex(),
  }));

  useEffect(() => {
    return subscribeHomeQuotePreview(() => {
      setQuotePreview({
        active: isHomeQuotePreviewActive(),
        index: getHomeQuotePreviewIndex(),
      });
    });
  }, []);

  const firstName = (answers.name || "").trim().split(" ")[0] || "Friend";
  const selectedAvatar = findAvatar(answers.avatarId);
  const appearanceValue = APPEARANCE_LABEL[themePref];

  // Legacy installs completed onboarding before `joinedAt` existed —
  // stamp once so Profile can show a join date going forward.
  useEffect(() => {
    if (answers.completed && typeof answers.joinedAt !== "number") {
      setAnswer("joinedAt", Date.now());
    }
  }, [answers.completed, answers.joinedAt, setAnswer]);

  const joinedLabel = useMemo(() => {
    if (typeof answers.joinedAt !== "number") return null;
    const when = new Date(answers.joinedAt).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    return `Joined ${when}`;
  }, [answers.joinedAt]);

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
      .map((day) => {
        const moment = findMomentByDay(day);
        if (!moment) return null;
        return { moment, type: resolveSermonType() };
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

  const handlePreviousSermon = () => {
    haptics.soft();
    advanceToPreviousMoment();
    router.navigate("/today");
  };

  const handleShuffleSermon = () => {
    haptics.tick();
    shuffleMoment();
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
      style={{ flex: 1, backgroundColor: colors.bg, overflow: "hidden" }}
      edges={["top"]}
    >
      <SkyGradient />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: contentLayout.gutter, paddingTop: 8, paddingBottom: 24, gap: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text accessibilityRole="header" style={[contentText.title, { color: colors.inkMuted }]}>Profile</Text>
            <ReaderNativeButton label="Settings" symbol="gearshape" onPress={() => navigateTo("/settings")} />
          </View>
          <View style={{ alignItems: "center", gap: 16 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Change profile avatar" onPress={() => setAvatarPickerOpen(true)} style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {selectedAvatar ? <Image source={selectedAvatar.source} contentFit="cover" style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }} /> : <Text style={[systemText.title1, { color: colors.ink }]}>{firstName.charAt(0).toUpperCase()}</Text>}
            </Pressable>
            <View style={{ alignItems: "center", gap: 4 }}>
              <Text style={[systemText.largeTitle, { color: colors.ink, textAlign: "center" }]}>{firstName}</Text>
              {joinedLabel && <Text style={[contentText.metadata, { color: colors.inkMuted }]}>{joinedLabel}</Text>}
            </View>
          </View>
        </View>

        <ProfileProgress />

        <ProfileCollectionShelf />
        <View style={{ marginHorizontal: contentLayout.gutter, marginTop: 32, gap: 16 }}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: savedExpanded }} onPress={() => setSavedExpanded(!savedExpanded)} style={{ minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <SFSymbol name="bookmark" size={22} color={colors.ink} />
            <Text style={[contentText.title, { color: colors.ink, flex: 1 }]}>Saved for you</Text>
            <SFSymbol name={savedExpanded ? "chevron.up" : "chevron.down"} size={14} color={colors.inkMuted} />
          </Pressable>
          {savedExpanded && <SegmentedControl appearance={scheme} values={["Devotionals", "Highlights", "Notes"]} selectedIndex={savedTab} onChange={event => setSavedTab(event.nativeEvent.selectedSegmentIndex)} style={{ height: 44 }} />}
        </View>
        {savedExpanded && savedTab === 0 && <>
        <SectionHeader
          title="Devotionals"
          count={savedCount}
          ink={colors.ink}
          inkSubtle={colors.textSecondary}
        />
        {recentSavedSermons.length === 0 ? (
          <ProfileEmptyCard
            title="No saved sermons yet"
            body="Tap Save on the closing screen of any sermon to keep it here for re-reading."
          />
        ) : (
          <View className="px-5 mt-2 gap-2">
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

        </>}
        {savedExpanded && savedTab === 1 && <>
        <SectionHeader
          title="Highlights"
          count={annotationCounts.highlights}
          onSeeAll={() => navigateTo("/highlights")}
          ink={colors.ink}
          inkSubtle={colors.textSecondary}
        />
        {recentHighlights.length === 0 ? (
          <ProfileEmptyCard
            title="No highlights yet"
            body="Long-press any verse to mark it — your highlights collect here."
          />
        ) : (
          <View className="px-5 mt-2 gap-2">
            {recentHighlights.map((highlight) => (
              <ProfileHighlightRow
                key={highlight.key}
                highlight={highlight}
                onPress={() => navigateTo(routeForVerse(highlight))}
              />
            ))}
          </View>
        )}

        </>}
        {savedExpanded && savedTab === 2 && <>
        <SectionHeader
          title="Notes"
          count={annotationCounts.notes}
          onSeeAll={() => navigateTo("/notes")}
          ink={colors.ink}
          inkSubtle={colors.textSecondary}
        />
        {recentNotes.length === 0 ? (
          <ProfileEmptyCard
            title="No notes yet"
            body="Write your first reflection from any verse — long-press to open the menu."
          />
        ) : (
          <View className="px-5 mt-2 gap-2">
            {recentNotes.map((note) => (
              <ProfileNoteRow
                key={note.noteId}
                note={note}
                onPress={() => navigateTo(routeForVerse(note))}
              />
            ))}
          </View>
        )}

        </>}

        {showDevShortcuts ? (
          <SettingsSection
            title="Developer"
            footer="Internal QA only. Reset and Restart wipe every provider on disk — progress, notes, focus sessions, reminders — then route to a fresh entry."
          >
            <SettingsLinkRow
              icon={<SFSymbol name="book" size={16} color={colors.ink} />}
              label="Preview Bible intro"
              sublabel="Replay the Bible welcome screen"
              onPress={() => { haptics.soft(); setBibleIntroPreviewOpen(true); }}
              showDivider
            />
            <SettingsLinkRow
              icon={<SFSymbol name="book" size={16} color={colors.ink} />}
              label="Bible reading tutorial"
              sublabel="Replay the reader feature guide"
              showDivider
              onPress={() => { haptics.soft(); setReaderTutorialOpen(true); }}
            />
            <SettingsLinkRow
              icon={
                <SFSymbol
                  name="backward.fill"
                  size={14}
                  color={colors.ink}
                  weight="semibold"
                />
              }
              label="Previous reading"
              sublabel={todaysMoment.title}
              value={`${catalogPosition.position} / ${catalogPosition.total}`}
              onPress={handlePreviousSermon}
              showDivider
            />
            <SettingsLinkRow
              icon={
                <SFSymbol
                  name="forward.fill"
                  size={14}
                  color={colors.ink}
                  weight="semibold"
                />
              }
              label="Next reading"
              sublabel={todaysMoment.title}
              value={`${catalogPosition.position} / ${catalogPosition.total}`}
              onPress={handleAdvanceSermon}
              showDivider
            />
            <SettingsLinkRow
              icon={
                <SFSymbol
                  name="shuffle"
                  size={14}
                  color={colors.ink}
                  weight="semibold"
                />
              }
              label="Shuffle reading"
              sublabel="Jump to a random catalog day"
              value={`${catalogPosition.position} / ${catalogPosition.total}`}
              onPress={handleShuffleSermon}
              showDivider
            />
            <SettingsLinkRow
              icon={
                <SFSymbol
                  name="text.quote"
                  size={14}
                  color={colors.ink}
                  weight="semibold"
                />
              }
              label="Next home quote"
              sublabel={
                quotePreview.active
                  ? `Preview ${(quotePreview.index ?? 0) + 1} of ${quoteCount}`
                  : `${quoteCount} quotes · tap to preview`
              }
              onPress={() => {
                haptics.tick();
                advanceHomeQuotePreview();
                setQuotePreview({
                  active: isHomeQuotePreviewActive(),
                  index: getHomeQuotePreviewIndex(),
                });
                router.navigate("/today");
              }}
              showDivider
            />
            <SettingsLinkRow
              icon={
                <SFSymbol
                  name="arrow.uturn.backward"
                  size={14}
                  color={colors.ink}
                  weight="semibold"
                />
              }
              label="Reset home quote"
              sublabel={
                quotePreview.active
                  ? "Back to morning/evening/night rotation"
                  : "Already on daily rotation"
              }
              onPress={() => {
                haptics.soft();
                clearHomeQuotePreview();
                setQuotePreview({
                  active: isHomeQuotePreviewActive(),
                  index: getHomeQuotePreviewIndex(),
                });
                router.navigate("/today");
              }}
              showDivider
            />
            <SettingsToggleRow
              icon={
                <SFSymbol
                  name="rosette"
                  size={16}
                  color={colors.ink}
                  weight="semibold"
                />
              }
              label="Unlock all milestone badges"
              sublabel="Browse every badge in Your Journey"
              value={unlockAllMilestones}
              onValueChange={(next) => {
                haptics.soft();
                setUnlockAllMilestones(next);
              }}
              showDivider
            />
            <SettingsLinkRow
              icon={
                <SFSymbol
                  name="arrow.counterclockwise"
                  size={14}
                  color={colors.destructive}
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
                  color={colors.destructive}
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

      </ScrollView>

      {readerTutorialOpen && <ReaderTutorial preview onClose={() => setReaderTutorialOpen(false)} />}
      {showDevShortcuts && bibleIntroPreviewOpen ? (
        <BibleIntroScreen onComplete={() => setBibleIntroPreviewOpen(false)} />
      ) : null}

      <AvatarPickerSheet
        visible={avatarPickerOpen}
        selectedId={answers.avatarId}
        onSelect={(id) => {
          haptics.tick();
          setAnswer("avatarId", id);
        }}
        onClear={() => {
          haptics.tick();
          setAnswer("avatarId", undefined);
        }}
        onClose={() => setAvatarPickerOpen(false)}
      />
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
      className="px-5 flex-row items-end justify-between"
      style={{ marginTop: contentLayout.sectionGap, gap: contentLayout.itemGap, flexWrap: "wrap" }}
    >
      <View className="flex-row items-baseline" style={{ flexShrink: 1, flexWrap: "wrap" }}>
        <Text
          style={[systemText.title2, { color: ink }]}
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
            minHeight: 44,
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
          ...contentLayout.card,
          backgroundColor: colors.surface,
        }}
      >
        <View className="flex-row items-baseline justify-between" style={{ flexWrap: "wrap", gap: contentLayout.textGap }}>
          <Text
            style={[
              contentText.title,
              { color: colors.ink },
            ]}
          >
            {formatRef(note)}
          </Text>
          <Text
            style={{
              ...contentText.metadata,
              color: colors.inkMuted,
            }}
          >
            {relativeTime(note.updatedAt || note.createdAt)}
          </Text>
        </View>
        <Text
          style={{
            ...contentText.description,
            color: colors.ink,
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
          ...contentLayout.card,
          backgroundColor: colors.surface,
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
          <View className="flex-row items-baseline justify-between" style={{ flexWrap: "wrap", gap: contentLayout.textGap }}>
            <Text
              style={[
                contentText.title,
                { color: colors.ink },
              ]}
            >
              {formatRef(highlight)}
            </Text>
            <Text
              style={{
                ...contentText.metadata,
              color: colors.inkMuted,
              }}
            >
              {relativeTime(highlight.updatedAt)}
            </Text>
          </View>
          <Text
            style={{
              ...contentText.description,
              color: colors.inkMuted,
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
          ...contentLayout.card,
          backgroundColor: colors.surface,
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
            style={[
              systemText.captionEmphasized,
              { color: accent },
            ]}
            numberOfLines={1}
          >
            {typeName}
          </Text>
          <Text
            style={[
              contentText.title,
              {
                color: colors.ink,
                marginTop: contentLayout.textGap,
              },
            ]}
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
    <View className="px-5 mt-2">
      <View
        style={{
          paddingVertical: 12,
          gap: contentLayout.textGap,
        }}
      >
        <Text
          style={{
            ...systemText.headline,
            color: colors.ink,

          }}
        >
          {title}
        </Text>
        <Text
          style={{
            ...systemText.subheadline,
            color: colors.textSecondary,

            marginTop: contentLayout.textGap,
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
        style={[systemText.title2, { color: colors.ink }]}
      >
        {value}
      </Text>
      <Text
        style={[
          systemText.captionEmphasized,
          { color: colors.inkMuted, marginTop: 4 },
        ]}
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


/**
 * GearIcon — the chrome-row affordance in the top-right of the
 * page. Mirrors the reference "Me" screen's settings cog, which
 * lives outside any list and acts as a quiet escape into the
 * deeper preferences. Sized to land in a 36pt rounded chip so
 * the tap target is comfortable without dominating the header.
 */
function GearIcon({ stroke }: IconProps) {
  return <SFSymbol name="gearshape" size={20} color={stroke} weight="medium" />;
}

function UserIcon({ stroke }: IconProps) {
  return <SFSymbol name="person.circle" size={14} color={stroke} weight="medium" />;
}

function MailIcon({ stroke }: IconProps) {
  return <SFSymbol name="envelope" size={14} color={stroke} weight="medium" />;
}

function BellIcon({ stroke }: IconProps) {
  return <SFSymbol name="bell" size={14} color={stroke} weight="medium" />;
}

function FlameIcon({ stroke }: IconProps) {
  return <SFSymbol name="flame.fill" size={14} color={stroke} weight="medium" />;
}

function MoonIcon({ stroke }: IconProps) {
  return <SFSymbol name="moon" size={14} color={stroke} weight="medium" />;
}

function HeartIcon({ stroke }: IconProps) {
  return <SFSymbol name="heart" size={14} color={stroke} weight="medium" />;
}

function DocIcon({ stroke }: IconProps) {
  return <SFSymbol name="doc.text" size={14} color={stroke} weight="medium" />;
}

function InfoIcon({ stroke }: IconProps) {
  return <SFSymbol name="info.circle" size={14} color={stroke} weight="medium" />;
}

function CodeIcon({ stroke }: IconProps) {
  return <SFSymbol name="chevron.left.forwardslash.chevron.right" size={14} color={stroke} weight="medium" />;
}
