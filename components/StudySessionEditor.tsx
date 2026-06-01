import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandGlyph } from "@/components/BrandGlyph";
import { TimePickerModal } from "@/components/TimePickerModal";
import {
  DEFAULT_BLOCKED_APP_IDS,
  SOCIAL_APPS,
  type SocialAppId,
} from "@/lib/focus";
import { formatReminderTime } from "@/lib/notifications";
import type { WeekdayIndex } from "@/lib/notifications";
import { useFocus } from "@/state/focus";
import {
  WEEKDAY_LABELS,
  type StudySession,
  type StudySessionDraft,
} from "@/state/studySessions";
import { useColors } from "@/state/theme";

/**
 * Bottom-sheet editor for creating or updating a single study
 * session.
 *
 * Used by /settings/study-sessions for both flows:
 *   • New session   → `existing` is undefined; the form initializes
 *                     from `NEW_SESSION_DEFAULTS` (a sensible 7:00 AM
 *                     weekdays starting point that the user can
 *                     immediately accept or tweak)
 *   • Edit session  → `existing` is the session record; the form
 *                     seeds from it and Save dispatches an update
 *
 * The editor never mutates persisted state directly. It composes
 * a `StudySessionDraft` and hands it off via `onSubmit`, leaving
 * the choice of `addSession` vs `updateSession` to the parent.
 * That separation keeps the editor reusable and the parent's
 * intent (which mutation to perform) explicit.
 *
 * Validation:
 *   • Name can be empty — we fall back to "Bible study" in the
 *     notification body and on the landing screen so the user
 *     isn't blocked at "pick a great name."
 *   • Days defaults to [] but Save is disabled when empty —
 *     a session with zero active days would schedule no
 *     notifications, which is a silently-broken outcome we'd
 *     rather prevent at the form level.
 *
 * UX shape:
 *   • iOS-style bottom sheet with explicit Cancel | title | Save
 *     header (mirrors TimePickerModal so the two screens feel
 *     consistent when stacked).
 *   • KeyboardAvoidingView wraps the body so the TextInput slides
 *     above the keyboard rather than being covered.
 *   • Time row opens the existing TimePickerModal — single source
 *     of truth for time pickers across the app.
 *   • Day chips are 7 small squares in Sun→Sat order, identical
 *     to the visual language Calendar / Health use for weekday
 *     selectors.
 */
export type StudySessionEditorProps = {
  visible: boolean;
  /** When present, the editor seeds from this session and Save
   *  dispatches an update. When absent, the editor starts fresh
   *  and Save creates a new one. */
  existing?: StudySession;
  onClose: () => void;
  onSubmit: (draft: StudySessionDraft) => void | Promise<void>;
};

/** iOS-system-blue. We use this for the editor's primary CTAs (header
 *  Save and bottom Create / Save changes button) instead of the
 *  ink/primaryFg pair so the create affordance is unmistakably a
 *  pressable BUTTON in both themes — an ink-colored button in dark
 *  mode is white-on-black which technically has enough contrast but
 *  visually competes with the white section-header titles next to it,
 *  making the button read as just more text. A signature blue button
 *  resolves that ambiguity instantly. */
const PRIMARY_BLUE = "#0A84FF";

// One-time enablement so LayoutAnimation works on Android too. On iOS
// this is a no-op; on Android it flips the UIManager flag that gates
// the animation API. The check guards against re-enabling on hot
// reload, which doesn't break anything but logs a warning.
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Curve used for the focus-toggle expand/collapse — matches the
 *  iOS "spring" feel without overshoot, so the Apps-to-silence card
 *  fades and slides into place rather than popping into existence.
 *  We define this once instead of using the Preset literals so the
 *  duration is consistent across all the editor's layout transitions. */
const SMOOTH_LAYOUT = {
  duration: 240,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
} as const;

/** Base defaults for a new session — note the empty `blockedAppIds`,
 *  which is intentional: the editor fills that in at mount time from
 *  the user's current focus-prefs list (or the catalog default if
 *  that's empty too) so a fresh session inherits whatever app-list
 *  curation the user has already done globally.
 *
 *  `useFocusMode` defaults to TRUE for new sessions. Earlier this
 *  defaulted to false ("just a reminder") to avoid surprising
 *  upgrading users, but for someone explicitly CREATING a Bible
 *  study session that was a worse default — the most common
 *  feedback was "I turned on Morning Study and nothing shows on
 *  home." The reason was that the home pill only mentions sessions
 *  with focus opted in, and the opt-in was a hidden second toggle.
 *
 *  Flipping the default so new sessions immediately participate in
 *  Focus mode lines the editor up with the home pill and the
 *  Practice tab's FOCUS ON badge: Save → routine appears
 *  everywhere it should, no extra step. The user can still turn it
 *  off in the editor if they only want a calendar nudge; legacy
 *  sessions loaded from disk keep whatever value they were saved
 *  with (see state/studySessions.tsx migration). */
const NEW_SESSION_BASE: StudySessionDraft = {
  name: "Morning Study",
  time: { hour: 7, minute: 15 },
  daysOfWeek: [1, 2, 3, 4, 5],
  enabled: true,
  useFocusMode: true,
  blockedAppIds: [],
};

export function StudySessionEditor({
  visible,
  existing,
  onClose,
  onSubmit,
}: StudySessionEditorProps) {
  const colors = useColors();
  const { prefs: focusPrefs, setEnabled: setFocusEnabled } = useFocus();

  // The starting blocked-app list for NEW sessions. We prefer the
  // user's global focus prefs (so per-session creation inherits
  // their curation) and fall back to the catalog default. Wrapped
  // in useMemo so the reference is stable for the seeding effect
  // below — without that, every parent re-render would re-trigger
  // the seeding effect and stomp the user's in-progress edits.
  const newSessionDefaults = useMemo<StudySessionDraft>(() => {
    const seedApps =
      focusPrefs.blockedAppIds.length > 0
        ? [...focusPrefs.blockedAppIds]
        : [...DEFAULT_BLOCKED_APP_IDS];
    return { ...NEW_SESSION_BASE, blockedAppIds: seedApps };
  }, [focusPrefs.blockedAppIds]);

  // Draft state — the working copy the user is editing. Commit
  // happens only on Save (Cancel discards). Seeded from existing
  // or defaults on every (re-)open so reopening the editor never
  // shows a stale prior draft.
  const [draft, setDraft] = useState<StudySessionDraft>(() =>
    existing ? toDraft(existing) : newSessionDefaults,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reseed on visibility change so the form always reflects the
  // intended starting state (new vs the latest values for the
  // existing session). Using `visible` as a dep covers the common
  // "close & reopen with different target" case the parent uses.
  useEffect(() => {
    if (!visible) return;
    setDraft(existing ? toDraft(existing) : newSessionDefaults);
    setSubmitting(false);
  }, [visible, existing, newSessionDefaults]);

  const isEditing = Boolean(existing);
  const canSave = draft.daysOfWeek.length > 0 && !submitting;

  const toggleDay = (day: WeekdayIndex) => {
    // Day chips don't change layout but the footer text and the
    // disabled-state Save button do; a light layout animation keeps
    // the whole form feeling like a single living surface rather
    // than a sequence of disconnected updates.
    LayoutAnimation.configureNext(SMOOTH_LAYOUT);
    setDraft((cur) => {
      const has = cur.daysOfWeek.includes(day);
      const next = has
        ? cur.daysOfWeek.filter((d) => d !== day)
        : ([...cur.daysOfWeek, day] as WeekdayIndex[]);
      // Sort so any consumer of `daysOfWeek` (notification scheduler,
      // formatter) gets a canonical ordering regardless of the
      // sequence the user tapped chips in.
      next.sort((a, b) => a - b);
      return { ...cur, daysOfWeek: next };
    });
  };

  /**
   * Flip the per-session focus opt-in with a smooth layout animation.
   *
   * Two side-effects, both designed to keep the per-session toggle
   * here perfectly in sync with the home screen's "Focus mode" pill:
   *
   *   1. Layout animation — the Apps-to-silence section appears or
   *      disappears under this toggle, so without an animation the
   *      form snaps jarringly each time the user flips it. A short
   *      ease-in/out matches the iOS system-animation cadence the
   *      rest of the app sits in.
   *
   *   2. Auto-enable global focus when the user opts THIS session
   *      INTO focus. The Practice tab's "FOCUS ON" badge and the
   *      home pill both read `focusPrefs.enabled`, so flipping a
   *      session's opt-in on while the global toggle is off would
   *      visibly desync the two surfaces (the session row would say
   *      "FOCUS PAUSED" and the home pill would still be off). By
   *      flipping the master on at the same moment, the user gets
   *      a single coherent truth: turning ON focus for ANY session
   *      turns ON focus globally. They can still disable globally
   *      later from the home pill — and that immediately re-greys
   *      every session badge, which is exactly the sync behavior
   *      the user is asking for.
   *
   *   We intentionally do NOT auto-disable global focus when the
   *   user turns OFF a session's opt-in — other sessions may still
   *   be using focus, and the sermon flow uses the global flag too.
   *   Disabling global focus is a deliberate act, owned by the home
   *   pill / settings page.
   */
  const toggleFocusMode = (next: boolean) => {
    LayoutAnimation.configureNext(SMOOTH_LAYOUT);
    setDraft((cur) => ({ ...cur, useFocusMode: next }));
    if (next && !focusPrefs.enabled) {
      setFocusEnabled(true);
    }
  };

  /**
   * Add / remove an app from the session's per-routine block list.
   * Mirrors the toggleDay shape: pure state mutation, no validation
   * (an empty list is allowed — the routine still scheduling notifs,
   * just without silencing any apps when started).
   */
  const toggleApp = (id: SocialAppId) => {
    setDraft((cur) => {
      const has = cur.blockedAppIds.includes(id);
      const next = has
        ? cur.blockedAppIds.filter((x) => x !== id)
        : [...cur.blockedAppIds, id];
      return { ...cur, blockedAppIds: next };
    });
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: draft.name.trim(),
        time: draft.time,
        daysOfWeek: draft.daysOfWeek,
        // Newly-created sessions are always enabled when the user
        // taps Save — they just told us they want this to fire.
        // Existing sessions preserve their enabled flag (the row's
        // switch is the way to pause without opening the editor).
        enabled: existing ? draft.enabled : true,
        useFocusMode: draft.useFocusMode,
        blockedAppIds: draft.blockedAppIds,
      });
    } finally {
      // setSubmitting(false) is unnecessary here — the parent
      // closes the modal on submit, which triggers our visibility
      // reset effect above and clears submitting back to false.
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        accessibilityLabel="Dismiss"
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "flex-end",
        }}
      >
        {/* Inner Pressable swallows taps on the sheet so they don't
            bubble up and dismiss. KeyboardAvoidingView keeps the
            text input above the keyboard on iOS. */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.bg,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: 1,
              borderColor: colors.border,
              maxHeight: "92%",
            }}
          >
            <SafeAreaView edges={["bottom"]}>
              {/* Drag indicator */}
              <View className="items-center pt-2.5 pb-2">
                <View
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.inkSubtle,
                    opacity: 0.4,
                  }}
                />
              </View>

              {/* Header: Cancel | Title | Save */}
              <View className="flex-row items-center px-5 pt-1 pb-3">
                <Pressable
                  onPress={onClose}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <Text
                    className="text-[15px]"
                    style={{
                      fontFamily: "PlusJakartaSans_500Medium",
                      color: colors.inkMuted,
                    }}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <View className="flex-1 items-center px-3">
                  <Text
                    className="text-ink text-[15px]"
                    style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                  >
                    {isEditing ? "Edit session" : "New session"}
                  </Text>
                </View>
                <Pressable
                  onPress={handleSave}
                  disabled={!canSave}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Save session"
                  style={({ pressed }) => ({
                    opacity: pressed || !canSave ? 0.4 : 1,
                  })}
                >
                  <Text
                    className="text-[15px]"
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      // Signature iOS-blue so this reads as a tap
                      // target in both themes (white-on-black ink
                      // version was visually competing with the
                      // header title text). Matches the bottom CTA.
                      color: PRIMARY_BLUE,
                    }}
                  >
                    Save
                  </Text>
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Name */}
                <FieldGroup title="Name">
                  <View
                    className="rounded-2xl px-4 py-3"
                    style={{
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <TextInput
                      value={draft.name}
                      onChangeText={(text) =>
                        setDraft((cur) => ({ ...cur, name: text }))
                      }
                      placeholder="Morning Study"
                      placeholderTextColor={colors.inkSubtle}
                      maxLength={40}
                      style={{
                        color: colors.ink,
                        fontFamily: "PlusJakartaSans_500Medium",
                        fontSize: 15,
                        paddingVertical: 6,
                      }}
                      returnKeyType="done"
                    />
                  </View>
                </FieldGroup>

                {/* Time */}
                <FieldGroup
                  title="Time"
                  footer="The notification fires at this time on the days you select."
                >
                  <Pressable
                    onPress={() => setPickerOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Change time"
                  >
                    <View
                      className="rounded-2xl px-4 py-3.5 flex-row items-center"
                      style={{
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text
                        className="flex-1 text-ink text-[15px]"
                        style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
                      >
                        {formatReminderTime(draft.time)}
                      </Text>
                      <Text
                        className="text-[12.5px]"
                        style={{
                          fontFamily: "PlusJakartaSans_700Bold",
                          color: colors.primary,
                        }}
                      >
                        Change
                      </Text>
                    </View>
                  </Pressable>
                </FieldGroup>

                {/* Days
                    Apple-style: 7 evenly-spaced day chips that fill
                    the row width, then presets as a separate
                    segmented control below. The previous layout used
                    fixed-width 40px chips with justify-between which
                    left big asymmetric gaps and made the row read as
                    "two letters with empty space" in dark mode. The
                    flex-fill approach scales the chips to the
                    available width and gives them visible breathing
                    room. */}
                <FieldGroup
                  title="Days"
                  footer={
                    draft.daysOfWeek.length === 0
                      ? "Choose at least one day to schedule reminders."
                      : `Repeats every ${formatDaysFooter(draft.daysOfWeek)}.`
                  }
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      // Negative-margin trick so the first/last chip
                      // align flush to the section edges while the
                      // inner chips get even gaps from flex spacing.
                      marginHorizontal: -2,
                    }}
                  >
                    {WEEKDAY_LABELS.map((day) => {
                      const selected = draft.daysOfWeek.includes(day.index);
                      return (
                        <DayChip
                          key={day.index}
                          label={day.short}
                          selected={selected}
                          onPress={() => toggleDay(day.index)}
                          accessibilityLabel={`Toggle ${day.full}`}
                        />
                      );
                    })}
                  </View>

                  {/* Day presets — Apple-style segmented control. The
                      previous "pill row" rendered three ghost-styled
                      chips that visually merged in dark mode (low-
                      contrast surface bg blended with the modal bg
                      and the labels ran together). A single divided
                      segmented control is unambiguous about being a
                      group of three discrete actions. */}
                  <View
                    className="mt-4"
                    style={{
                      flexDirection: "row",
                      backgroundColor: withAlphaHex(colors.ink, 0.06),
                      borderRadius: 10,
                      padding: 3,
                    }}
                  >
                    <PresetSegment
                      label="Weekdays"
                      active={presetMatchWeekdays(draft.daysOfWeek)}
                      onPress={() => {
                        LayoutAnimation.configureNext(SMOOTH_LAYOUT);
                        setDraft((cur) => ({
                          ...cur,
                          daysOfWeek: [1, 2, 3, 4, 5],
                        }));
                      }}
                    />
                    <PresetSegment
                      label="Weekends"
                      active={presetMatchWeekends(draft.daysOfWeek)}
                      onPress={() => {
                        LayoutAnimation.configureNext(SMOOTH_LAYOUT);
                        setDraft((cur) => ({
                          ...cur,
                          daysOfWeek: [0, 6],
                        }));
                      }}
                    />
                    <PresetSegment
                      label="Every day"
                      active={presetMatchEveryDay(draft.daysOfWeek)}
                      onPress={() => {
                        LayoutAnimation.configureNext(SMOOTH_LAYOUT);
                        setDraft((cur) => ({
                          ...cur,
                          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                        }));
                      }}
                    />
                  </View>
                </FieldGroup>

                {/* ─── Use focus mode (per-session opt-in) ─────
                    Decoupled from global focus prefs so a routine
                    can be JUST a reminder (toggle off) or a full
                    "begin → silence apps → read" practice (toggle
                    on). Defaults off to avoid surprising users who
                    just want a calendar nudge at the chosen time.

                    The Apps-to-silence section below is rendered
                    only when this toggle is on, so the editor
                    doesn't ask the user to curate a list they
                    aren't going to use. */}
                <View className="px-5 mt-5">
                  <Text
                    className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase mb-2.5 ml-1"
                    style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                  >
                    Focus mode
                  </Text>
                  <View
                    className="rounded-2xl px-4 py-3.5 flex-row items-center"
                    style={{
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View className="flex-1 pr-3">
                      <Text
                        className="text-ink text-[15px]"
                        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                      >
                        Silence apps during this session
                      </Text>
                      <Text
                        className="text-ink-muted text-[12.5px] mt-0.5 leading-[18px]"
                        style={{ fontFamily: "PlusJakartaSans_400Regular" }}
                      >
                        {draft.useFocusMode
                          ? "Tapping Begin will quiet the apps you pick below."
                          : "Just a reminder — Begin opens straight to the Library."}
                      </Text>
                    </View>
                    <Switch
                      value={draft.useFocusMode}
                      onValueChange={toggleFocusMode}
                      trackColor={{
                        false: withAlphaHex(colors.ink, 0.1),
                        true: "#3D8B6A",
                      }}
                      thumbColor="#F4F4F5"
                      ios_backgroundColor={withAlphaHex(colors.ink, 0.08)}
                    />
                  </View>
                </View>

                {/* ─── Apps to silence ─────────────────────────
                    Only rendered when focus is opted-in for this
                    routine. Visual model: a wrapped grid of brand-
                    colored glyph chips. Selected chips render at
                    full saturation; unselected chips dim to ~0.3
                    so the user can still recognize each app (the
                    color is the recognition cue) without confusing
                    the on/off state.

                    Defaults / All / Clear convenience row mirrors
                    the day presets so curating the list is fast. */}
                {draft.useFocusMode && (
                  <FieldGroup
                    title="Apps to silence"
                    footer={
                      draft.blockedAppIds.length === 0
                        ? "Tap an app to silence it during this session."
                        : `Silencing ${draft.blockedAppIds.length} ${
                            draft.blockedAppIds.length === 1
                              ? "app"
                              : "apps"
                          }. Tap to add or remove.`
                    }
                  >
                    <View className="flex-row flex-wrap -mx-1.5">
                      {SOCIAL_APPS.map((app) => {
                        const selected = draft.blockedAppIds.includes(app.id);
                        return (
                          <AppChip
                            key={app.id}
                            appId={app.id}
                            name={app.name}
                            selected={selected}
                            onPress={() => toggleApp(app.id)}
                          />
                        );
                      })}
                    </View>

                    {/* Apps presets — one-shot convenience actions
                        for curating the list. These are NOT a state
                        control (unlike the days presets which are a
                        segmented control), so we render them as
                        simple visible pill buttons with clear
                        separation. iOS-blue label so they read as
                        tap targets in both themes. */}
                    <View className="flex-row mt-3" style={{ gap: 8 }}>
                      <AppsPresetPill
                        label="Defaults"
                        onPress={() => {
                          LayoutAnimation.configureNext(SMOOTH_LAYOUT);
                          setDraft((cur) => ({
                            ...cur,
                            blockedAppIds: [...DEFAULT_BLOCKED_APP_IDS],
                          }));
                        }}
                      />
                      <AppsPresetPill
                        label="All apps"
                        onPress={() => {
                          LayoutAnimation.configureNext(SMOOTH_LAYOUT);
                          setDraft((cur) => ({
                            ...cur,
                            blockedAppIds: SOCIAL_APPS.map((a) => a.id),
                          }));
                        }}
                      />
                      <AppsPresetPill
                        label="Clear"
                        onPress={() => {
                          LayoutAnimation.configureNext(SMOOTH_LAYOUT);
                          setDraft((cur) => ({
                            ...cur,
                            blockedAppIds: [],
                          }));
                        }}
                      />
                    </View>
                  </FieldGroup>
                )}

                {/* ─── Primary CTA — pinned at the bottom of the
                    scroll content. We use the iOS-blue accent
                    (not ink) so the button is visually
                    unambiguous in both themes — an ink button in
                    dark mode is white-on-black which technically
                    has contrast but visually merges with the
                    surrounding white text. Blue is universally
                    read as "tap this". */}
                <View className="px-5 mt-7">
                  <Pressable
                    onPress={handleSave}
                    disabled={!canSave}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isEditing ? "Save changes" : "Create session"
                    }
                    style={({ pressed }) => ({
                      backgroundColor: PRIMARY_BLUE,
                      opacity: pressed || !canSave ? 0.5 : 1,
                      borderRadius: 18,
                      paddingVertical: 16,
                      alignItems: "center",
                    })}
                  >
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_700Bold",
                        fontSize: 15,
                        color: "#FFFFFF",
                        letterSpacing: 0.2,
                      }}
                    >
                      {isEditing ? "Save changes" : "Create session"}
                    </Text>
                  </Pressable>
                  {!canSave && draft.daysOfWeek.length === 0 && (
                    <Text
                      className="text-ink-subtle text-[12px] mt-2 text-center"
                      style={{ fontFamily: "PlusJakartaSans_400Regular" }}
                    >
                      Pick at least one day to create the session.
                    </Text>
                  )}
                </View>
              </ScrollView>
            </SafeAreaView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>

      {/* Reuse the daily-reminder time picker — same wheel, same
          confirmation model, themed to match. */}
      <TimePickerModal
        visible={pickerOpen}
        initial={draft.time}
        onConfirm={(time) => {
          setDraft((cur) => ({ ...cur, time }));
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────

function FieldGroup({
  title,
  footer,
  children,
}: {
  title: string;
  footer?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="px-5 mt-5">
      <Text
        className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase mb-2.5 ml-1"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        {title}
      </Text>
      {children}
      {footer && (
        <Text
          className="text-ink-subtle text-[12px] leading-[18px] mt-2.5 px-1"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          {footer}
        </Text>
      )}
    </View>
  );
}

/**
 * AppChip — a tappable brand-glyph chip + small caption that
 * represents one entry in the per-session block list.
 *
 * Visual states:
 *   • selected   — full brand color glyph, ink-color name, faint
 *                  selection outline so it reads as obviously chosen
 *   • unselected — same glyph at reduced opacity, ink-muted name —
 *                  recognizable but visibly "off"
 *
 * Fixed item width keeps the wrap-grid columns aligned regardless
 * of name length. The grid uses `flex-wrap` so a long catalog
 * spills naturally onto subsequent rows.
 */
function AppChip({
  appId,
  name,
  selected,
  onPress,
}: {
  appId: SocialAppId;
  name: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Toggle ${name}`}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        width: "25%", // 4 chips per row on phones
        paddingHorizontal: 6,
        paddingVertical: 8,
        alignItems: "center",
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View
        style={{
          borderRadius: 14,
          padding: 3,
          borderWidth: 2,
          borderColor: selected ? colors.ink : "transparent",
          opacity: selected ? 1 : 0.32,
        }}
      >
        <BrandGlyph appId={appId} size="md" />
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: "PlusJakartaSans_600SemiBold",
          fontSize: 11,
          marginTop: 6,
          color: selected ? colors.ink : colors.inkSubtle,
          textAlign: "center",
          maxWidth: 64,
        }}
      >
        {name}
      </Text>
    </Pressable>
  );
}

/**
 * Day chip — one of seven in the days strip.
 *
 * Layout shape: each chip declares `flex: 1` plus a small horizontal
 * margin so the seven chips evenly fill the row regardless of screen
 * width. The previous fixed-40px-width version left big asymmetric
 * gaps with `justify-between`, which read on dark backgrounds as "two
 * chips floating at the edges" instead of "a row of seven."
 *
 * Selected state uses iOS-system-blue fill so the chosen days pop on
 * any theme — the previous ink-on-ink pair (white pill in dark mode)
 * had contrast on paper but blended visually with the bold white
 * text elsewhere on the form. Blue is universally read as "active."
 */
function DayChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        flex: 1,
        marginHorizontal: 3,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: selected
          ? PRIMARY_BLUE
          : withAlphaHex(colors.ink, 0.06),
        borderWidth: selected ? 0 : 1,
        borderColor: withAlphaHex(colors.ink, 0.12),
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          fontSize: 14,
          color: selected ? "#FFFFFF" : colors.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Convenience-action pill for the Apps-to-silence section. Unlike
 * PresetSegment (which represents a state — "weekdays is currently
 * picked"), these are one-shot actions that rewrite the app list
 * and immediately give up focus, so we render them as small but
 * unambiguous tap targets with the iOS-blue label that the rest of
 * the editor uses for non-destructive primary actions.
 */
function AppsPresetPill({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: withAlphaHex(PRIMARY_BLUE, 0.12),
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          fontSize: 12,
          color: PRIMARY_BLUE,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * One "segment" of the three-option presets row.
 *
 * Designed to look like an iOS UISegmentedControl button: pill with
 * `flex: 1` so the three segments share the row width equally, and
 * an active state that lifts the selected segment to a surface color
 * with a subtle shadow-equivalent border. Inactive segments stay
 * transparent over the parent's tinted background so the whole
 * thing reads as a single unified control.
 */
function PresetSegment({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => ({
        flex: 1,
        paddingVertical: 7,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? colors.surface : "transparent",
        borderWidth: active ? 1 : 0,
        borderColor: withAlphaHex(colors.ink, 0.08),
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: active
            ? "PlusJakartaSans_700Bold"
            : "PlusJakartaSans_600SemiBold",
          fontSize: 12.5,
          color: active ? colors.ink : colors.inkMuted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** Convert a persisted session into the editor's working draft —
 *  strips the bookkeeping fields the editor doesn't own and clones
 *  any arrays so the editor can mutate freely without leaking
 *  changes back into the persisted record before Save. */
function toDraft(session: StudySession): StudySessionDraft {
  return {
    name: session.name,
    time: session.time,
    daysOfWeek: [...session.daysOfWeek],
    enabled: session.enabled,
    useFocusMode: session.useFocusMode,
    blockedAppIds: [...session.blockedAppIds],
  };
}

// ─────────────────────────────────────────────────────────────────
// Days helpers
// ─────────────────────────────────────────────────────────────────

/** Does the current days selection exactly match Mon–Fri? */
function presetMatchWeekdays(days: WeekdayIndex[]): boolean {
  if (days.length !== 5) return false;
  return [1, 2, 3, 4, 5].every((d) => days.includes(d as WeekdayIndex));
}

/** Does the current days selection exactly match Sat + Sun? */
function presetMatchWeekends(days: WeekdayIndex[]): boolean {
  if (days.length !== 2) return false;
  return days.includes(0) && days.includes(6);
}

/** Does the current days selection cover all seven days? */
function presetMatchEveryDay(days: WeekdayIndex[]): boolean {
  return days.length === 7;
}

/**
 * Human-readable summary of the active days for the field footer.
 * Collapses common patterns into named phrases ("weekdays," "every
 * day") so the user gets a one-glance read of what they picked.
 */
function formatDaysFooter(days: WeekdayIndex[]): string {
  if (presetMatchEveryDay(days)) return "day";
  if (presetMatchWeekdays(days)) return "weekday";
  if (presetMatchWeekends(days)) return "weekend";
  const sorted = [...days].sort((a, b) => a - b);
  return sorted.map((d) => WEEKDAY_LABELS[d].full).join(", ");
}

/**
 * Compose an alpha into a `#RRGGBB` hex string and return a CSS
 * `rgba(...)` string. Used for the Switch's track tints (we want
 * the same low-alpha ink wash the rest of the app uses for "off"
 * switches without pulling a shared utils file just for one fn).
 */
function withAlphaHex(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return hex;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Re-export so other callers (e.g. a future onboarding step that
// pre-creates a session for the user to tweak) can reuse the same
// base defaults the editor ships with. NEW_SESSION_BASE has an
// empty blockedAppIds — callers are responsible for filling that
// from focus prefs or the catalog default.
export { NEW_SESSION_BASE };
