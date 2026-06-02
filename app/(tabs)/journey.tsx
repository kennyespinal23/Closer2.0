import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { BrandGlyph } from "@/components/BrandGlyph";
import { StudySessionEditor } from "@/components/StudySessionEditor";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import { useFocusMiniPlayerSpacing } from "@/components/FocusMiniPlayer";
import {
  formatRef,
  relativeTime,
  routeForVerse,
} from "@/lib/annotationsFormat";
import {
  findSocialApp,
  isShieldSupported,
  summarizeBlockedApps,
} from "@/lib/focus";
import {
  formatReminderTime,
  type WeekdayIndex,
} from "@/lib/notifications";
import {
  groupTemplatesByCategory,
  templateToDraft,
  type RoutineTemplate,
} from "@/lib/routineTemplates";
import { useFocus } from "@/state/focus";
import {
  type Highlight,
  type Note,
  useAnnotations,
} from "@/state/annotations";
import {
  formatDaysOfWeek,
  useStudySessions,
  WEEKDAY_LABELS,
  type StudySession,
} from "@/state/studySessions";
import { useColors } from "@/state/theme";

/**
 * Practice — the user's personal hub.
 *
 * This tab used to be "Journey" (a chronological timeline of every
 * action in the app). That presentation didn't land well in user
 * testing — it felt like staring at a logbook rather than something
 * actionable. We've repurposed the slot to host the three personal
 * artefacts users actually return to:
 *
 *   1. STUDY SESSIONS  — the customizable focus routines (recurring
 *                        scheduled Bible-reading commitments)
 *   2. SAVED VERSES    — every highlighted verse, with quick-open
 *                        cards and a "See all" drill-in
 *   3. NOTES           — every written reflection, same pattern
 *
 * Each section is self-contained with its own header, count, and a
 * single primary affordance. Sections are intentionally NOT cards-
 * within-cards — the section header acts as the chrome and the
 * content sits flat below it, mirroring how Settings groups stack
 * sections without nested borders.
 *
 * The previous Journey timeline implementation lives in git history;
 * the data sources it consumed (sermon completions, check-in log,
 * chapter reads) are all still available through their providers if
 * we ever want to resurrect it as a profile-drawer page.
 */
export default function PracticeScreen() {
  const router = useRouter();
  const colors = useColors();

  const {
    sessions: studySessions,
    addSession,
    updateSession,
  } = useStudySessions();
  const { allHighlights, allNotes, counts } = useAnnotations();
  // Focus state owns both the per-session prefs AND the currently
  // active session. We use:
  //   • `prefs.enabled` to know whether scheduled routines that
  //     opt into focus mode should be drawn as "FOCUS ON" or
  //     "FOCUS PAUSED" (master switch is single source of truth).
  //   • `session` to drive the Now card at the top of the screen
  //     — the hero card only renders when a session is in flight.
  //   • `endSession` for the End button inside the Now card so the
  //     user can stop the session without leaving this surface.
  const { prefs: focusPrefs, session: activeSession, endSession } =
    useFocus();

  // Memoize the (potentially-large) annotation lists so we don't
  // re-derive them on every parent re-render. They depend on the
  // annotations state, which is a plain object reference — the
  // useAnnotations hook returns stable callback identities, so a
  // useMemo here keyed on the helpers is the cheapest way to
  // avoid recomputation churn.
  const highlights = useMemo(() => allHighlights(), [allHighlights]);
  const notes = useMemo(() => allNotes(), [allNotes]);

  // Recent slices — the preview row shows the freshest 3 entries.
  // "See all" drills into the full /highlights or /notes screens.
  const recentHighlights = highlights.slice(0, 3);
  const recentNotes = notes.slice(0, 3);

  // ── Live ticker for the active session card + upcoming labels ──
  // Two derivations on this screen depend on the current wall-clock
  // time and need to refresh themselves periodically:
  //   • The active focus card's elapsed counter ("12:34").
  //   • The "Starting in 2h 15m" / "Starting in 36s" relative
  //     labels under each upcoming session card.
  // A single 1-second interval drives both — cheaper than letting
  // each card spin its own timer. We don't render the value
  // directly into the JSX; we just bump a state version so the
  // memos below recompute. Only ticking while the screen is
  // mounted (no global listener) keeps the cost negligible.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => (n + 1) % 1_000_000), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Upcoming sessions, sorted by their next-run time ──
  // Disabled sessions are dropped — they intentionally don't fire,
  // so "Upcoming" wouldn't be true. Users still see disabled
  // sessions when they go to manage them through the editor (they
  // can re-enable from the row switch in /settings/study-sessions).
  // We compute the next-run for each enabled session and sort
  // ascending so the soonest sits on top — matching how Opal's
  // Upcoming column is ordered.
  const now = Date.now();
  const upcomingSessions = useMemo(() => {
    const list = studySessions
      .filter((s) => s.enabled)
      .map((s) => ({ session: s, nextRunAt: nextRunDate(s, new Date(now)) }))
      .filter(
        (entry): entry is { session: StudySession; nextRunAt: Date } =>
          entry.nextRunAt !== null,
      );
    list.sort((a, b) => a.nextRunAt.getTime() - b.nextRunAt.getTime());
    return list;
    // Dependency on `now` here is intentional — the 1s tick above
    // updates `now`, which re-orders sessions whose next-run time
    // just crossed midnight, the start of a new day, etc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studySessions, now]);

  // Originating routine name for the active focus session, when
  // applicable. Surfaces "Morning Study" instead of just "Focus"
  // on the Now hero card.
  const activeRoutineName = activeSession?.routineId
    ? studySessions.find((s) => s.id === activeSession.routineId)?.name
    : undefined;

  // Editor target: null = closed, "new" = creating, "<id>" = editing.
  // Single piece of state keeps open/close trivially correct, and
  // matches the model used on /settings/study-sessions so the editor
  // component itself doesn't need to know which surface invoked it.
  const [editorTarget, setEditorTarget] = useState<null | "new" | string>(null);
  // When the user taps "Add" on a template card we pre-shape the
  // draft and stash it here. The editor reads `prefill` and seeds
  // its initial draft from it (instead of the bare NEW_SESSION_BASE
  // defaults), so the curated time/days/apps land in the form
  // ready to inspect or tweak. Cleared on editor close so the next
  // bare "+ New" tap doesn't accidentally reuse a stale template.
  const [editorPrefill, setEditorPrefill] = useState<
    ReturnType<typeof templateToDraft> | undefined
  >(undefined);
  const editingSession =
    editorTarget && editorTarget !== "new"
      ? studySessions.find((s) => s.id === editorTarget)
      : undefined;

  // Open the editor in CREATE mode seeded from the given template.
  // Centralizes the two state updates so every template card uses
  // the same gesture wiring — easier to swap later if we decide
  // tapping a card should skip the editor entirely and write
  // straight through to the routine list.
  const handleAddTemplate = (template: RoutineTemplate) => {
    setEditorPrefill(templateToDraft(template));
    setEditorTarget("new");
  };

  // Pre-grouped template list for the Templates section. Memoized
  // because `groupTemplatesByCategory` walks the catalog every call
  // and we only need to do that once per mount — the catalog is a
  // module-level constant, not state, so the result is stable.
  const templateGroups = useMemo(() => groupTemplatesByCategory(), []);

  // The FocusMiniPlayer floats above the GlassTabBar whenever a
  // session is active. When it's visible we reserve a little more
  // bottom padding so the last list item doesn't sit under it.
  // Returns 0 when no session is active, so the layout stays the
  // same on the most-common path.
  const miniPlayerSpacing = useFocusMiniPlayerSpacing();

  // Confirmation alert + tear-down for the Now card's End button.
  // Mirrors the FocusMiniPlayer's flow so the same gesture feels
  // identical regardless of which surface the user invoked it from.
  const handleEndActive = () => {
    Alert.alert(
      "End focus session?",
      isShieldSupported()
        ? "Apps will be unblocked right away. You can start another session anytime."
        : "Your focus commitment will end. You can start another one anytime.",
      [
        { text: "Keep focusing", style: "cancel" },
        {
          text: "End session",
          style: "destructive",
          onPress: () => {
            endSession().catch(() => {
              /* shield teardown is best-effort */
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          // Floating tab bar sits over the screen — pad the bottom
          // enough that the last card clears the bar by ~16pt, plus
          // an extra clearance when the mini-player is visible.
          paddingBottom: TAB_BAR_TOTAL_HEIGHT + 16 + miniPlayerSpacing,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header — single large title, no eyebrow.
            "Practice" frames the page as the user's spiritual
            practice in a faith-app context, without leaning into
            "settings" or "log" vocabulary that would feel clinical. */}
        <View className="px-6 pt-2">
          <Text
            className="text-ink text-[28px] leading-[36px] tracking-[-0.4px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            Practice
          </Text>
          <Text
            className="text-ink-muted text-[14px] mt-1.5 leading-[20px]"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          >
            Your rhythm of practice — what&apos;s on right now and
            what&apos;s coming up next.
          </Text>
        </View>

        {/* ─── Now ────────────────────────────────────────────────
            Only renders when a focus session is currently active.
            Modeled on Opal's "Now" hero card: large session name,
            big elapsed counter, row of blocked-app glyphs, and an
            End pill on the right. Acts as the focus session's
            primary control surface on this tab. */}
        {activeSession ? (
          <View>
            <SectionHeader title="Now" count={0} />
            <ActiveFocusCard
              title={activeRoutineName ?? "Focus Mode"}
              startedAt={activeSession.startedAt}
              blockedAppIds={activeSession.blockedAppIds}
              onEnd={handleEndActive}
            />
          </View>
        ) : null}

        {/* ─── Upcoming ───────────────────────────────────────────
            The user's scheduled study sessions, sorted by next-run
            time. Rendered as Opal-style cards (large name, time +
            day chips, "Starting in 2h 15m" tag) — a richer
            presentation than the previous flat-row list, which
            buried the schedule info in small grey text.

            "+ New" sits in the section header so creating a fresh
            routine is always one tap away even when the list is
            empty. The editor modal is shared with
            /settings/study-sessions. */}
        <SectionHeader
          title="Upcoming"
          count={upcomingSessions.length}
          actionLabel="+ New"
          actionVariant="primary"
          onAction={() => setEditorTarget("new")}
        />
        {studySessions.length === 0 ? (
          <EmptyStudySessions onCreate={() => setEditorTarget("new")} />
        ) : upcomingSessions.length === 0 ? (
          // Sessions exist but none are enabled — point the user at
          // /settings/study-sessions where row switches live, OR at
          // the editor to add a fresh one.
          <EmptyUpcoming onCreate={() => setEditorTarget("new")} />
        ) : (
          <View className="mt-2">
            {upcomingSessions.map(({ session, nextRunAt }) => (
              <UpcomingSessionCard
                key={session.id}
                session={session}
                nextRunAt={nextRunAt}
                now={new Date(now)}
                globalFocusEnabled={focusPrefs.enabled}
                onTap={() => setEditorTarget(session.id)}
              />
            ))}
          </View>
        )}

        {/* ─── Templates ──────────────────────────────────────────
            Curated, Christianized presets the user can add to their
            routines with one tap. Modeled on Opal's preset cards
            (Laser Focus / Rise & Shine / etc.), but the names and
            cadences are reframed for a faith app — Morning Devotion,
            Sabbath Rest, Evening Reflection, etc.

            One horizontal scroller per category so the catalog reads
            as two distinct invitations: "Deepen your practice" for
            the committed focus blocks, and "Anchors through the
            day" for the gentle daily reminders. */}
        {templateGroups.map((group) => (
          <View key={group.category} className="mt-2">
            <TemplatesSectionHeader
              title={group.label}
              subtitle={group.subtitle}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              // contentInset preferred over paddingHorizontal so the
              // first card aligns with the rest of the screen's
              // 20pt gutter AND the last card has matching trailing
              // breathing room. paddingHorizontal alone would cut
              // the trailing inset since RN's ScrollView treats it
              // as snap-to-edge on the last item.
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 4,
                paddingBottom: 4,
              }}
              // Decelerate quickly so flicks feel snappy on shorter
              // catalogs (4 cards barely span more than 1.5 viewport
              // widths) — without this, fast scrolls overshoot past
              // the last card and the rubber-band feels wasteful.
              decelerationRate="fast"
            >
              {group.templates.map((template, i) => (
                <View
                  key={template.id}
                  style={{ marginRight: i < group.templates.length - 1 ? 12 : 0 }}
                >
                  <TemplateCard
                    template={template}
                    onAdd={() => handleAddTemplate(template)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        ))}

        {/* ─── Saved Verses ─────────────────────────────────────── */}
        <SectionHeader
          title="Saved verses"
          count={counts.highlights}
          actionLabel={highlights.length > 0 ? "See all" : undefined}
          onAction={() => router.push("/highlights")}
        />
        {highlights.length === 0 ? (
          <EmptyHighlights />
        ) : (
          <View className="mt-1">
            {recentHighlights.map((h) => (
              <HighlightPreview
                key={h.key}
                highlight={h}
                onPress={() => router.push(routeForVerse(h))}
              />
            ))}
          </View>
        )}

        {/* ─── Notes ────────────────────────────────────────────── */}
        <SectionHeader
          title="Notes"
          count={counts.notes}
          actionLabel={notes.length > 0 ? "See all" : undefined}
          onAction={() => router.push("/notes")}
        />
        {notes.length === 0 ? (
          <EmptyNotes />
        ) : (
          <View className="mt-1">
            {recentNotes.map((n) => (
              <NotePreview
                key={n.noteId}
                note={n}
                onPress={() => router.push(routeForVerse(n))}
              />
            ))}
          </View>
        )}

        {/* A touch of bottom breathing room before the tab bar so
            the final section header isn't optically pressed to the
            bar's top edge. */}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Editor modal — shared with /settings/study-sessions so the
          add/edit flow looks and feels identical regardless of where
          it was opened from. `key` derived from target so React fully
          remounts when switching between sessions (cleans draft state). */}
      <StudySessionEditor
        // Key includes the prefill template name so opening the
        // editor from "+ New" → template A → Cancel → template B
        // remounts the editor instead of reusing the previous
        // template's draft state. Without this, the second open
        // would briefly flash the first template's name/time
        // before the visibility-change effect reseeded.
        key={
          editorTarget === "new"
            ? `new-${editorPrefill?.name ?? "blank"}`
            : (editorTarget ?? "closed")
        }
        visible={editorTarget !== null}
        existing={editingSession}
        prefill={editorTarget === "new" ? editorPrefill : undefined}
        onClose={() => {
          setEditorTarget(null);
          setEditorPrefill(undefined);
        }}
        onSubmit={async (draft) => {
          if (editorTarget === "new") {
            await addSession(draft);
          } else if (editorTarget) {
            await updateSession(editorTarget, draft);
          }
          setEditorTarget(null);
          setEditorPrefill(undefined);
        }}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Section primitives
// ─────────────────────────────────────────────────────────────────

/**
 * Title + count + optional action button, used to announce each
 * section. Uses a generous top margin so adjacent sections breathe
 * — closer spacing would make this read as one uninterrupted scroll
 * of cards.
 *
 * Two action variants:
 *   • "link"    — quiet text link in the primary color (See all /
 *                 Manage). Recedes into the header chrome.
 *   • "primary" — pill button with ink background. Used for the
 *                 "+ New" affordance on Study Sessions so the
 *                 create gesture is unmistakably visible even
 *                 when the section is empty.
 */
function SectionHeader({
  title,
  count,
  actionLabel,
  onAction,
  actionVariant = "link",
}: {
  title: string;
  count: number;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: "link" | "primary";
}) {
  const colors = useColors();
  return (
    <View className="flex-row items-center justify-between px-6 mt-9 mb-1.5">
      <View className="flex-row items-baseline flex-1">
        <Text
          className="text-ink text-[19px] leading-[24px] tracking-[-0.2px]"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {title}
        </Text>
        {count > 0 && (
          <Text
            className="text-ink-subtle text-[13px] ml-2"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            {count}
          </Text>
        )}
      </View>
      {actionLabel && onAction && actionVariant === "link" && (
        <Pressable
          onPress={onAction}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} ${title}`}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text
            className="text-[13px]"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.primary,
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
      {actionLabel && onAction && actionVariant === "primary" && (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} ${title}`}
          style={({ pressed }) => ({
            // iOS-blue rather than ink so the pill reads as a tap
            // target in both themes — an ink pill in dark mode is
            // white-on-black, which technically has contrast but
            // visually competes with the white section title sitting
            // next to it (both render as "white text"). A signature
            // blue pill is unambiguous "this is a button."
            backgroundColor: PRIMARY_BLUE,
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 999,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 12.5,
              color: "#FFFFFF",
              letterSpacing: 0.2,
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Verse preview rows
// ─────────────────────────────────────────────────────────────────

function HighlightPreview({
  highlight,
  onPress,
}: {
  highlight: Highlight;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      className="mx-5 mt-2 rounded-2xl border border-border bg-surface overflow-hidden flex-row"
    >
      {/* Left stripe in the highlight's color — matches how each
          card on /highlights opens with its color identity. */}
      <View
        style={{
          width: 4,
          backgroundColor: highlight.color.swatch,
        }}
      />
      <View className="flex-1 px-4 py-3.5">
        <View className="flex-row items-baseline justify-between">
          <Text
            className="text-[10.5px] tracking-[2.5px] uppercase"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.primary,
            }}
          >
            {formatRef(highlight)}
          </Text>
          <Text
            className="text-ink-subtle text-[11px]"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            {relativeTime(highlight.updatedAt)}
          </Text>
        </View>
        {highlight.verseText ? (
          <Text
            className="text-ink-muted text-[13.5px] mt-1.5 leading-[19px]"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            numberOfLines={2}
          >
            &ldquo;{highlight.verseText}&rdquo;
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function NotePreview({
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
      className="mx-5 mt-2 rounded-2xl border border-border bg-surface px-4 py-3.5"
    >
      <View className="flex-row items-baseline justify-between">
        <Text
          className="text-[10.5px] tracking-[2.5px] uppercase"
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: colors.primary,
          }}
        >
          {formatRef(note)}
        </Text>
        <Text
          className="text-ink-subtle text-[11px]"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
        >
          {relativeTime(note.updatedAt)}
        </Text>
      </View>
      <Text
        className="text-ink text-[14px] mt-2 leading-[20px]"
        style={{ fontFamily: "PlusJakartaSans_500Medium" }}
        numberOfLines={3}
      >
        {note.text}
      </Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Empty states — invitations, not apologies
// ─────────────────────────────────────────────────────────────────

function EmptyStudySessions({ onCreate }: { onCreate: () => void }) {
  const colors = useColors();
  return (
    <View className="mx-5 mt-2 rounded-2xl border border-border bg-surface px-5 py-6 items-center">
      <View
        className="w-11 h-11 rounded-full items-center justify-center mb-3"
        style={{ backgroundColor: colors.accentSoft }}
      >
        <CalendarGlyph stroke={colors.inkMuted} size={18} />
      </View>
      <Text
        className="text-ink text-[15px] text-center"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        No sessions yet
      </Text>
      <Text
        className="text-ink-muted text-[12.5px] text-center mt-1 leading-[18px] px-3"
        style={{ fontFamily: "PlusJakartaSans_400Regular" }}
      >
        Schedule a time to step into the Word. Closer will quiet the
        noise and meet you there.
      </Text>
      <Pressable
        onPress={onCreate}
        accessibilityRole="button"
        accessibilityLabel="Add your first session"
        className="mt-4 rounded-full"
        style={({ pressed }) => ({
          // Match the header pill: iOS-blue + white label so this
          // button reads as a primary tap target in both themes.
          backgroundColor: PRIMARY_BLUE,
          paddingHorizontal: 18,
          paddingVertical: 10,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 13.5,
            color: "#FFFFFF",
            letterSpacing: 0.2,
          }}
        >
          Create a session
        </Text>
      </Pressable>
    </View>
  );
}

function EmptyHighlights() {
  const colors = useColors();
  return (
    <View className="mx-5 mt-2 rounded-2xl border border-border bg-surface px-5 py-6 items-center">
      <View
        className="w-11 h-11 rounded-full items-center justify-center mb-3"
        style={{ backgroundColor: colors.accentSoft }}
      >
        <HighlightGlyph stroke={colors.inkMuted} />
      </View>
      <Text
        className="text-ink text-[15px] text-center"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        Nothing kept yet
      </Text>
      <Text
        className="text-ink-muted text-[12.5px] text-center mt-1 leading-[18px] px-3"
        style={{ fontFamily: "PlusJakartaSans_400Regular" }}
      >
        Tap and hold a verse while reading to mark it. The ones
        you keep appear here.
      </Text>
    </View>
  );
}

function EmptyNotes() {
  const colors = useColors();
  return (
    <View className="mx-5 mt-2 rounded-2xl border border-border bg-surface px-5 py-6 items-center">
      <View
        className="w-11 h-11 rounded-full items-center justify-center mb-3"
        style={{ backgroundColor: colors.accentSoft }}
      >
        <NoteGlyph stroke={colors.inkMuted} />
      </View>
      <Text
        className="text-ink text-[15px] text-center"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        No notes yet
      </Text>
      <Text
        className="text-ink-muted text-[12.5px] text-center mt-1 leading-[18px] px-3"
        style={{ fontFamily: "PlusJakartaSans_400Regular" }}
      >
        Write a reflection from any verse to anchor what spoke to
        you. They live here for later.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

function CalendarGlyph({
  stroke,
  size = 16,
}: {
  stroke: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16v12H4zM4 7V5a1 1 0 011-1h14a1 1 0 011 1v2"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path
        d="M8 3v4M16 3v4M9 12h6M9 15h4"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function HighlightGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 19l3-3h12V5H5a1 1 0 00-1 1z"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function NoteGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4h11l4 4v12H5zM7 9h8M7 13h8M7 17h5"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ChevronIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
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

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * iOS-system-blue. Used for the create-session primary CTAs
 * (section-header pill + empty-state card button). We deliberately
 * pick a fixed brand color rather than colors.ink so the buttons
 * read as primary tap targets in both light and dark themes — an
 * ink-colored button in dark mode is white-on-black which has
 * sufficient contrast but visually merges with the white section
 * title sitting beside it.
 */
const PRIMARY_BLUE = "#0A84FF";

function withAlpha(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return hex;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─────────────────────────────────────────────────────────────────
// Now + Upcoming
// ─────────────────────────────────────────────────────────────────

/**
 * Hero card surfaced at the top of the screen when a focus session
 * is in flight. Visual model lifted from Opal's "Now" card:
 *
 *   ┌─────────────────────────────────────────────────────┐
 *   │  Morning Study                              End  ⓧ  │
 *   │  Blocking · Instagram, TikTok & 8 more              │
 *   │                                                     │
 *   │  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  12:34   │
 *   │                                                     │
 *   │  [IG] [TT] [YT] [X] [RD] [FB] +6                    │
 *   └─────────────────────────────────────────────────────┘
 *
 * The big numeric is elapsed time. We don't have a session duration
 * concept yet (focus sessions are open-ended in the current state
 * model), so the "progress bar" is a decorative scrolling sweep
 * tied to the seconds tick rather than a true progress indicator.
 * When we add proper durations / Break / Resume, this card swaps
 * the sweep for a real progress bar.
 *
 * Tapping the body opens /settings/focus so the user can manage
 * the blocked-apps list mid-session. The End pill ends the session
 * inline after a confirm — same flow as the FocusMiniPlayer.
 */
function ActiveFocusCard({
  title,
  startedAt,
  blockedAppIds,
  onEnd,
}: {
  title: string;
  startedAt: number;
  blockedAppIds: ReadonlyArray<string>;
  onEnd: () => void;
}) {
  const router = useRouter();
  const colors = useColors();

  // Live elapsed re-derives on each parent tick. Cheap — just a
  // subtraction and a formatter call. We don't memoize: render
  // already happens once per second from the parent's ticker.
  const elapsedMs = Math.max(0, Date.now() - startedAt);
  const elapsedLabel = formatElapsedLong(elapsedMs);

  // First N blocked apps render as glyph chips; the remainder
  // collapses to "+M". Keeps the row scannable on narrow widths
  // and means an "All apps" selection doesn't fill the entire
  // card with glyphs.
  const MAX_GLYPHS = 6;
  const glyphIds = blockedAppIds.slice(0, MAX_GLYPHS);
  const overflow = Math.max(0, blockedAppIds.length - MAX_GLYPHS);

  const subtitle =
    blockedAppIds.length > 0
      ? `Blocking · ${summarizeBlockedApps(blockedAppIds)}`
      : "No apps quieted — just a reminder";

  // IMPORTANT: The visual chrome (background, border, padding) lives
  // on an inner <View>, NOT on the Pressable's function-form style.
  // NativeWind's CssInterop drops layout + visual props from a
  // Pressable's `({pressed}) => ({...})` style on iOS (same bug that
  // broke the StudySessionEditor's day chips), so we keep ONLY the
  // dynamic opacity in the Pressable and hand all paint to the
  // inner View. Layout (margins, shadow) goes on the OUTER wrapper
  // because shadow needs to be on a non-clipping ancestor — the
  // inner View has `overflow: hidden` so the rounded corners don't
  // bleed past the radius.
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginTop: 8,
        borderRadius: 22,
        // Lift the card off the page with a soft accent glow.
        // Lives on the outer View (no overflow:hidden) so the
        // shadow can actually render past the card's bounds.
        shadowColor: PRIMARY_BLUE,
        shadowOpacity: 0.22,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <Pressable
        onPress={() => router.push("/settings/focus")}
        accessibilityRole="button"
        accessibilityLabel={`Active focus session: ${title}. ${elapsedLabel} elapsed. Tap to manage apps.`}
        style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}
      >
        <View
          style={{
            borderRadius: 22,
            // Bold blue wash so the live card pops clearly against
            // both white (light) and near-black (dark) page bgs.
            // Plain `colors.surface` blended with the page bg in
            // light mode, and a 6% wash was too subtle to register
            // as a card. 13% reads clearly on white without
            // competing with the FocusMiniPlayer's own accent.
            backgroundColor: withAlpha(PRIMARY_BLUE, 0.13),
            borderWidth: 1.5,
            borderColor: withAlpha(PRIMARY_BLUE, 0.5),
            padding: 16,
          }}
        >
      {/* Title row */}
      <View className="flex-row items-start">
        <View className="flex-1 pr-3">
          <Text
            className="text-ink text-[17px] leading-[22px]"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              letterSpacing: -0.1,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            className="text-ink-muted text-[12px] leading-[16px] mt-0.5"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onEnd();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="End focus session"
          style={({ pressed }) => ({
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 14,
            backgroundColor: withAlpha(PRIMARY_BLUE, 0.14),
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 12.5,
              color: PRIMARY_BLUE,
              letterSpacing: 0.3,
            }}
          >
            End
          </Text>
        </Pressable>
      </View>

      {/* Elapsed counter — the focal number on the card. Tabular
          digits so the width is stable second-to-second. */}
      <View className="flex-row items-baseline mt-3">
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 36,
            color: colors.ink,
            letterSpacing: -1,
            fontVariant: ["tabular-nums"],
            lineHeight: 40,
          }}
        >
          {elapsedLabel}
        </Text>
        <Text
          className="text-ink-subtle text-[11px] tracking-[1.6px] uppercase ml-2"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          Elapsed
        </Text>
      </View>

      {/* App glyph row — gives the user a visual confirmation of
          which apps are currently in their shield. Tapping a
          glyph doesn't do anything in this view (the row is
          read-only); editing the list happens in /settings/focus
          which is where the card body itself routes. */}
      {glyphIds.length > 0 ? (
        <View className="flex-row items-center mt-4" style={{ gap: 8 }}>
          {glyphIds.map((id) => {
            const app = findSocialApp(id);
            if (!app) return null;
            return (
              <View
                key={id}
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  // Same subtle outline as the AppChip in the editor
                  // — visually anchors the colorful glyph against
                  // the card surface.
                  borderWidth: 1,
                  borderColor: withAlpha(colors.ink, 0.08),
                }}
              >
                <BrandGlyph appId={app.id} size="sm" />
              </View>
            );
          })}
          {overflow > 0 ? (
            <View
              style={{
                paddingHorizontal: 10,
                height: 32,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: withAlpha(colors.ink, 0.06),
                borderWidth: 1,
                borderColor: withAlpha(colors.ink, 0.08),
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 12,
                  color: colors.inkMuted,
                }}
              >
                +{overflow}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
        </View>
      </Pressable>
    </View>
  );
}

/**
 * Empty state for the Upcoming section when the user has sessions
 * on file but all of them are disabled (none are upcoming). Visually
 * distinct from EmptyStudySessions (which shows when the user has
 * no sessions at all) so the message is accurate to the underlying
 * state instead of misleadingly saying "no sessions yet."
 */
function EmptyUpcoming({ onCreate }: { onCreate: () => void }) {
  const colors = useColors();
  return (
    <View className="mx-5 mt-2 rounded-2xl p-5 items-center" style={{
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    }}>
      <Text
        className="text-ink text-[14px] text-center"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        Nothing scheduled
      </Text>
      <Text
        className="text-ink-muted text-[12.5px] leading-[18px] text-center mt-1.5"
        style={{ fontFamily: "PlusJakartaSans_400Regular" }}
      >
        All your sessions are paused. Re-enable one from settings, or
        add a new routine to start a rhythm.
      </Text>
      {/* Outer wrapping View nails the layout (centered, fixed top
          margin) so the Pressable inside doesn't need to carry any
          layout-affecting properties. This dodges the NativeWind
          CssInterop bug that silently drops layout styles from a
          Pressable's function-form `style` prop on iOS — the bug
          that made the editor's day chips render as bare text in
          a prior iteration. */}
      <View className="items-center" style={{ marginTop: 14 }}>
        <Pressable
          onPress={onCreate}
          accessibilityRole="button"
          accessibilityLabel="Add a new study session"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 11,
              borderRadius: 14,
              backgroundColor: PRIMARY_BLUE,
            }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 13.5,
                color: "#FFFFFF",
                letterSpacing: 0.3,
              }}
            >
              New routine
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Opal-style card for a single upcoming session. Bigger than the
 * old flat-row presentation so the schedule reads at a glance:
 * routine name on top, time + day chips in the middle, and a
 * relative "Starting in 2h 15m" pill anchored on the right.
 */
function UpcomingSessionCard({
  session,
  nextRunAt,
  now,
  globalFocusEnabled,
  onTap,
}: {
  session: StudySession;
  nextRunAt: Date;
  now: Date;
  globalFocusEnabled: boolean;
  onTap: () => void;
}) {
  const colors = useColors();
  const relative = formatStartsIn(nextRunAt, now);

  // The badge mirrors the same "is focus active for this routine?"
  // logic the existing StudySessionRow uses, so the home pill and
  // this card never disagree about what's about to happen.
  const focusBadge =
    session.useFocusMode && session.blockedAppIds.length > 0
      ? globalFocusEnabled
        ? { label: "Focus mode", tone: "active" as const }
        : { label: "Focus paused", tone: "paused" as const }
      : null;

  // Same Pressable-style fix as ActiveFocusCard: layout in the outer
  // View, visual chrome in an inner View, only `opacity` in the
  // Pressable's function-form style. See ActiveFocusCard for the
  // full rationale on why this pattern is required.
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 18,
      }}
    >
      <Pressable
        onPress={onTap}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${session.name}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}
      >
        <View
          style={{
            borderRadius: 18,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 14,
          }}
        >
      <View className="flex-row items-start">
        <View className="flex-1 pr-3">
          {/* Source tag — "Closer" badge differentiates system-seeded
              routines from user-created ones. Mirrors the same
              presentation used on /settings/study-sessions. */}
          {session.source === "system" ? (
            <Text
              className="text-[9.5px] tracking-[1.8px] uppercase mb-1"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: colors.inkSubtle,
              }}
            >
              Closer routine
            </Text>
          ) : null}
          <Text
            className="text-ink text-[16px] leading-[22px]"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              letterSpacing: -0.1,
            }}
            numberOfLines={1}
          >
            {session.name}
          </Text>
          <Text
            className="text-ink-muted text-[12.5px] leading-[18px] mt-0.5"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            numberOfLines={1}
          >
            {formatReminderTime(session.time)}
            {"  ·  "}
            {formatDaysOfWeek(session.daysOfWeek)}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: withAlpha(colors.ink, 0.06),
            borderWidth: 1,
            borderColor: withAlpha(colors.ink, 0.08),
          }}
        >
          <Text
            className="text-[10.5px] tracking-[0.4px] uppercase"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.ink,
            }}
          >
            {relative}
          </Text>
        </View>
      </View>

      {/* Day chips strip — mini-version of the editor's strip, used
          here as a visual recap of which days the session fires.
          Read-only on this card; tap the card to edit. */}
      <View className="flex-row mt-3" style={{ gap: 4 }}>
        {WEEKDAY_LABELS.map((d) => {
          const active = session.daysOfWeek.includes(d.index);
          return (
            <View
              key={d.index}
              style={{
                flex: 1,
                height: 24,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active
                  ? withAlpha(PRIMARY_BLUE, 0.18)
                  : withAlpha(colors.ink, 0.05),
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 10.5,
                  color: active ? PRIMARY_BLUE : colors.inkSubtle,
                }}
              >
                {d.short}
              </Text>
            </View>
          );
        })}
      </View>

      {focusBadge ? (
        <View
          className="flex-row items-center mt-3"
          style={{ gap: 6 }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor:
                focusBadge.tone === "active" ? "#34C759" : colors.inkSubtle,
            }}
          />
          <Text
            className="text-[10.5px] tracking-[1.2px] uppercase"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color:
                focusBadge.tone === "active" ? "#34C759" : colors.inkSubtle,
            }}
          >
            {focusBadge.label}
          </Text>
        </View>
      ) : null}
        </View>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Time helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Compute the next future Date a recurring study session will fire.
 *
 * Walks up to the next 8 days looking for a day whose JS weekday
 * (0–6) is in the session's daysOfWeek AND whose firing time
 * hasn't already passed today. Returns null if the session has no
 * active days (a malformed state the editor guards against, but
 * we defend here too).
 *
 * Notes on edge cases:
 *   • "Today, after the firing time" → loop falls through to
 *     tomorrow and beyond.
 *   • "Today, before the firing time" → returns today at hh:mm.
 *   • DST: we construct the Date with local hour/minute via
 *     `setHours`, which respects the device's DST rules. So
 *     scheduling at 7:00 AM on the spring-forward day correctly
 *     yields the actual local 7:00 AM, not 8:00 AM.
 */
function nextRunDate(session: StudySession, from: Date): Date | null {
  if (session.daysOfWeek.length === 0) return null;
  for (let i = 0; i < 8; i++) {
    const candidate = new Date(from);
    candidate.setDate(candidate.getDate() + i);
    candidate.setHours(session.time.hour, session.time.minute, 0, 0);
    const weekday = candidate.getDay() as WeekdayIndex;
    if (!session.daysOfWeek.includes(weekday)) continue;
    if (candidate.getTime() <= from.getTime()) continue;
    return candidate;
  }
  return null;
}

/**
 * Format a duration in ms as a friendly elapsed string used on the
 * ActiveFocusCard. Always uses H:MM:SS once an hour has passed,
 * otherwise M:SS. Mirrors the FocusMiniPlayer's format so the two
 * surfaces show the same elapsed timer side-by-side without
 * looking like they belong to different sessions.
 */
function formatElapsedLong(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) {
    const mm = String(minutes).padStart(2, "0");
    return `${hours}:${mm}:${ss}`;
  }
  return `${minutes}:${ss}`;
}

/**
 * Format the gap between `target` and `now` as a short relative
 * label fit for the corner pill on the UpcomingSessionCard:
 *
 *   • < 60s         → "In 30s"
 *   • < 60m         → "In 24m"
 *   • < 24h         → "In 2h 15m" (drops minutes when zero)
 *   • Same calendar day, later today → "Today" (we already pad
 *     the time + days strip below, so the pill stays terse)
 *   • Next calendar day               → "Tomorrow"
 *   • Within 6 days                   → "Sat 9:00 AM"
 *   • >= 7 days                       → "Sep 12 · 9:00 AM"
 *
 * Returned label is intentionally compact (all-caps friendly) so
 * the rounded pill doesn't have to grow to fit longer phrases.
 */
function formatStartsIn(target: Date, now: Date): string {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "Now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `In ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `In ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const restMin = minutes - hours * 60;
    return restMin > 0 ? `In ${hours}h ${restMin}m` : `In ${hours}h`;
  }

  // Same-day vs tomorrow vs further-out distinctions use the local
  // calendar day, not the elapsed-hours bucket — so "11pm today
  // looking at a 1am tomorrow session" reads as "Tomorrow," not
  // "In 2h," which is what the user is actually thinking.
  const sameYMD = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (sameYMD(target, tomorrow)) return "Tomorrow";

  const daysAhead = Math.floor(
    (target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (daysAhead < 7) {
    const dayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
      target.getDay()
    ];
    return `${dayShort}`;
  }
  const monthShort = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][target.getMonth()];
  return `${monthShort} ${target.getDate()}`;
}

// ─────────────────────────────────────────────────────────────────
// Templates section
// ─────────────────────────────────────────────────────────────────

/**
 * Section header for a templates row — title + supporting subtitle.
 * Different visual treatment than the main SectionHeader (no count
 * pill, no action button) because the section's affordance is each
 * card's own "Add" pill, not a single header CTA.
 */
function TemplatesSectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View className="px-6 mt-9 mb-2">
      <Text
        className="text-ink text-[19px] leading-[24px] tracking-[-0.2px]"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        {title}
      </Text>
      <Text
        className="text-ink-muted text-[12.5px] leading-[18px] mt-0.5"
        style={{ fontFamily: "PlusJakartaSans_500Medium" }}
      >
        {subtitle}
      </Text>
    </View>
  );
}

/**
 * Card representing a single routine template. Modeled on Opal's
 * preset cards: tall portrait-shape (160x200) with a colorful
 * gradient background, the template name in the upper half, a
 * short description below, and an "Add" pill anchored at the
 * bottom.
 *
 * Card layout (top → bottom):
 *   ┌──────────────────────┐
 *   │ ●  (accent dot)      │  ← top accent
 *   │                      │
 *   │  Morning Devotion    │  ← title
 *   │                      │
 *   │  Open the day in     │  ← description (2 lines)
 *   │  the Word.           │
 *   │                      │
 *   │            + Add    │  ← action pill
 *   └──────────────────────┘
 *
 * Tap target:
 *   The entire card is tappable for accessibility (so the user
 *   doesn't have to hit the small "Add" pill). The dedicated pill
 *   is visual reassurance — it labels the gesture, not gates it.
 *
 * Gradient rendering:
 *   Uses react-native-svg's <LinearGradient> instead of
 *   `expo-linear-gradient` because the SVG library is already a
 *   dep here (BookCover.tsx uses the same pattern). No extra
 *   install needed and no native module compatibility risk.
 */
function TemplateCard({
  template,
  onAdd,
}: {
  template: RoutineTemplate;
  onAdd: () => void;
}) {
  const colors = useColors();
  const CARD_WIDTH = 168;
  const CARD_HEIGHT = 196;
  return (
    // Outer wrapper owns layout (size + radius for shadow shape) so
    // the Pressable can keep its style prop to just opacity — same
    // NativeWind/Pressable workaround we use in ActiveFocusCard and
    // UpcomingSessionCard above.
    <View
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 22,
        shadowColor: "#000",
        shadowOpacity: 0.14,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      }}
    >
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={`Add ${template.name} routine`}
        accessibilityHint={template.description}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <View
          style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            borderRadius: 22,
            overflow: "hidden",
            // Border picks up the accent tone so the gradient
            // doesn't bleed into the page bg behind it on dense
            // scroll feeds.
            borderWidth: 1,
            borderColor: withAlpha(template.accent, 0.18),
          }}
        >
          {/* Background gradient — SVG-rendered, sized to fill the
              card. Two stops, vertical (top→bottom) so the visual
              weight sits at the foot of the card where the Add
              pill lives. */}
          <Svg
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <Defs>
              <LinearGradient
                id={`tg-${template.id}`}
                x1="0"
                y1="0"
                x2="0"
                y2={CARD_HEIGHT}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0" stopColor={template.gradientFrom} stopOpacity={1} />
                <Stop offset="1" stopColor={template.gradientTo} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect
              x={0}
              y={0}
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              fill={`url(#tg-${template.id})`}
            />
          </Svg>

          {/* Foreground content */}
          <View
            style={{
              flex: 1,
              padding: 14,
              justifyContent: "space-between",
            }}
          >
            {/* Top: small accent dot — adds a hint of "live indicator"
                even though the card is static, mirroring the live
                dot on the active-session card and the mini-player. */}
            <View
              style={{
                width: 9,
                height: 9,
                borderRadius: 5,
                backgroundColor: template.accent,
              }}
            />

            {/* Middle: name + description block */}
            <View>
              <Text
                numberOfLines={2}
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 17,
                  color: "#1A1A1F",
                  letterSpacing: -0.2,
                  lineHeight: 22,
                }}
              >
                {template.name}
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  fontFamily: "PlusJakartaSans_500Medium",
                  fontSize: 11.5,
                  color: withAlpha("#1A1A1F", 0.72),
                  lineHeight: 15,
                  marginTop: 4,
                }}
              >
                {template.description}
              </Text>
            </View>

            {/* Bottom: Add pill — right-anchored. We stop its
                onPress from bubbling so the body's onAdd doesn't
                fire twice. The pill IS the same action as the
                card body, but redundant fires would be wasteful
                and on shorter cards could even race. */}
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  onAdd();
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Add ${template.name}`}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.9)",
                    borderWidth: 1,
                    borderColor: withAlpha(template.accent, 0.18),
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 12,
                      color: template.accent,
                      marginRight: 4,
                      lineHeight: 14,
                    }}
                  >
                    +
                  </Text>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 12,
                      color: template.accent,
                      letterSpacing: 0.2,
                    }}
                  >
                    Add
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
  // colors is consumed by the surrounding screen chrome (the
  // SectionHeader's count pill, the ScrollView background) — not
  // by this card directly. Kept in scope so adding theme-aware
  // touches later (e.g. a dark-mode "lift" overlay on the gradient)
  // doesn't require re-plumbing the hook through the props.
  void colors;
}
