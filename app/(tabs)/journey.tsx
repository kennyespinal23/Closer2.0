import { useMemo, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { StudySessionEditor } from "@/components/StudySessionEditor";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import {
  formatRef,
  relativeTime,
  routeForVerse,
} from "@/lib/annotationsFormat";
import { formatReminderTime } from "@/lib/notifications";
import { useFocus } from "@/state/focus";
import {
  type Highlight,
  type Note,
  useAnnotations,
} from "@/state/annotations";
import {
  formatDaysOfWeek,
  useStudySessions,
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
    toggleSession,
  } = useStudySessions();
  const { allHighlights, allNotes, counts } = useAnnotations();
  // Read the global focus master toggle so the per-session "FOCUS ON"
  // badge can mirror it. When the master is OFF, sessions opted-in to
  // focus mode show a "PAUSED" state instead of the active green
  // badge — the user gets a single visual truth: focus is on globally
  // OR it isn't, and the per-session opt-in only matters when global
  // is on. This is what keeps the Practice tab and the home screen's
  // focus pill perfectly in sync.
  const { prefs: focusPrefs } = useFocus();

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

  // Editor target: null = closed, "new" = creating, "<id>" = editing.
  // Single piece of state keeps open/close trivially correct, and
  // matches the model used on /settings/study-sessions so the editor
  // component itself doesn't need to know which surface invoked it.
  const [editorTarget, setEditorTarget] = useState<null | "new" | string>(null);
  const editingSession =
    editorTarget && editorTarget !== "new"
      ? studySessions.find((s) => s.id === editorTarget)
      : undefined;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          // Floating tab bar sits over the screen — pad the bottom
          // enough that the last card clears the bar by ~16pt.
          paddingBottom: TAB_BAR_TOTAL_HEIGHT + 16,
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
            The routines you&apos;ve set and the verses you&apos;ve kept.
          </Text>
        </View>

        {/* ─── Study Sessions ─────────────────────────────────────
            The "+ New" action sits in the section header ALWAYS
            (even when the list is empty) so the create affordance
            is always one tap away — the previous flow buried it
            inside the empty-state card, which was easy to miss. */}
        <SectionHeader
          title="Study sessions"
          count={studySessions.length}
          actionLabel="+ New"
          actionVariant="primary"
          onAction={() => setEditorTarget("new")}
        />
        {studySessions.length === 0 ? (
          <EmptyStudySessions onCreate={() => setEditorTarget("new")} />
        ) : (
          <View className="mx-5 mt-2 rounded-2xl border border-border bg-surface overflow-hidden">
            {studySessions.map((session, i) => (
              <StudySessionRow
                key={session.id}
                session={session}
                globalFocusEnabled={focusPrefs.enabled}
                showDivider={i < studySessions.length - 1}
                onTap={() => setEditorTarget(session.id)}
                onToggle={() => toggleSession(session.id)}
              />
            ))}
            <AddSessionFooter onPress={() => setEditorTarget("new")} />
          </View>
        )}

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
        key={editorTarget ?? "closed"}
        visible={editorTarget !== null}
        existing={editingSession}
        onClose={() => setEditorTarget(null)}
        onSubmit={async (draft) => {
          if (editorTarget === "new") {
            await addSession(draft);
          } else if (editorTarget) {
            await updateSession(editorTarget, draft);
          }
          setEditorTarget(null);
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
// Study session rows
// ─────────────────────────────────────────────────────────────────

function StudySessionRow({
  session,
  globalFocusEnabled,
  showDivider,
  onTap,
  onToggle,
}: {
  session: StudySession;
  /** Master focus toggle from `useFocus().prefs.enabled`. The badge
   *  reads both this AND `session.useFocusMode` so the visual stays
   *  in lockstep with the home-screen focus pill. */
  globalFocusEnabled: boolean;
  showDivider: boolean;
  onTap: () => void;
  onToggle: () => void;
}) {
  const colors = useColors();
  // Three badge states encode the full sync truth:
  //   • "FOCUS ON"     — session opted in AND global is on  (live)
  //   • "FOCUS PAUSED" — session opted in but global is off (configured but inactive)
  //   • (no badge)     — session never opted in             (just a reminder)
  // This is what makes the Practice tab feel SAME-as the home pill:
  // turning off global focus immediately greys out every active
  // badge here, and turning on a session's focus opt-in lights it
  // up (because the editor auto-enables global focus on opt-in).
  const focusActive = session.useFocusMode && globalFocusEnabled;
  const focusPaused = session.useFocusMode && !globalFocusEnabled;
  return (
    // Outer wrapper is a non-pressable View so the Switch's tap can
    // never bubble to the row's "open editor" handler. Previously the
    // Switch lived INSIDE the row's Pressable — on some RN gesture
    // configurations the parent's onPress also fires when a child
    // Switch toggles, which caused the editor to pop up every time
    // the user tried to flip session.enabled. The user reads this as
    // "the focus buttons aren't working" because flipping anything
    // here yanks them into the editor instead of letting the toggle
    // settle. The fix mirrors the home-pill restructure: an inner
    // Pressable wraps ONLY the label area, the Switch is a sibling.
    <View>
      <View className="flex-row items-center px-4 py-3.5">
        <Pressable
          onPress={onTap}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${session.name || "study session"}`}
          className="flex-1 flex-row items-center pr-2"
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <View
            className="w-9 h-9 rounded-xl items-center justify-center mr-3"
            style={{
              // System routines get a soft warm wash to match their
              // "Closer" badge — visually distinct from user-created
              // rows but still recognizably the same row type. Picked
              // accentSoft for system so it reads like a curated
              // recommendation rather than a generic reminder.
              backgroundColor:
                session.source === "system"
                  ? withAlpha(colors.accent, 0.14)
                  : colors.accentSoft,
            }}
          >
            <CalendarGlyph
              stroke={session.source === "system" ? colors.accent : colors.ink}
            />
          </View>
          <View className="flex-1 pr-2">
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Text
                className="text-ink text-[15px]"
                style={{ fontFamily: "PlusJakartaSans_700Bold", flexShrink: 1 }}
                numberOfLines={1}
              >
                {session.name || "Unnamed study"}
              </Text>
              {/* "Closer" badge — only on routines seeded by
                  onboarding. The cue tells the user "the app set
                  this up for you; tune it however you like." A
                  pill rather than an icon so it reads as a label
                  at a glance even when scanning the list quickly. */}
              {session.source === "system" && (
                <View
                  style={{
                    paddingHorizontal: 6,
                    paddingVertical: 1.5,
                    borderRadius: 999,
                    backgroundColor: withAlpha(colors.accent, 0.16),
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 9.5,
                      color: colors.accent,
                      letterSpacing: 0.6,
                    }}
                  >
                    CLOSER
                  </Text>
                </View>
              )}
            </View>
            <Text
              className="text-ink-muted text-[12.5px] mt-0.5"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              numberOfLines={1}
            >
              {formatReminderTime(session.time)}
              {"  ·  "}
              {formatDaysOfWeek(session.daysOfWeek)}
            </Text>
            {(focusActive || focusPaused) && (
              <View className="flex-row items-center mt-1.5">
                <View
                  style={{
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 999,
                    backgroundColor: focusActive
                      ? withAlpha(PRIMARY_BLUE, 0.14)
                      : withAlpha(colors.ink, 0.06),
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <ShieldDot
                    stroke={focusActive ? PRIMARY_BLUE : colors.inkSubtle}
                  />
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 10,
                      color: focusActive ? PRIMARY_BLUE : colors.inkSubtle,
                      letterSpacing: 0.6,
                      marginLeft: 4,
                    }}
                  >
                    {focusActive ? "FOCUS ON" : "FOCUS PAUSED"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Pressable>
        {/* Enable/disable Switch — sibling, not child, of the label
            Pressable. Tap fires onToggle (session.enabled) without
            triggering the editor. */}
        <Switch
          value={session.enabled}
          onValueChange={onToggle}
          trackColor={{
            false: withAlpha(colors.ink, 0.1),
            true: "#3D8B6A",
          }}
          thumbColor="#F4F4F5"
          ios_backgroundColor={withAlpha(colors.ink, 0.08)}
        />
      </View>
      {showDivider && <View className="h-[1px] bg-border ml-[60px]" />}
    </View>
  );
}

/** Tiny shield glyph used only by the row's "FOCUS ON" badge. */
function ShieldDot({ stroke }: { stroke: string }) {
  return (
    <Svg width={9} height={9} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l8 3v6c0 4-3 7-8 9-5-2-8-5-8-9V6l8-3z"
        stroke={stroke}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AddSessionFooter({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  return (
    <View>
      <View className="h-[1px] bg-border" />
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Add a new study session"
      >
        <View className="flex-row items-center px-4 py-3.5">
          <View
            className="w-9 h-9 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: colors.accentSoft }}
          >
            <PlusIcon stroke={colors.ink} />
          </View>
          <Text
            className="flex-1 text-[14.5px]"
            style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              color: colors.primary,
            }}
          >
            Add a session
          </Text>
          <ChevronIcon stroke={colors.inkSubtle} />
        </View>
      </Pressable>
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

function PlusIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={stroke}
        strokeWidth={2}
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
