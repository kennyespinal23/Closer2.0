import { useCallback, useEffect, useState } from "react";
import {
  ActionSheetIOS,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { AppleSheet } from "@/components/AppleSheet";
import { SheetModalHeader } from "@/components/SheetModalHeader";
import { SFSymbol } from "@/components/Symbol";
import type { WeekdayIndex } from "@/lib/notifications";
import {
  WEEKDAY_LABELS,
  type StudySession,
} from "@/state/studySessions";
import { useColors, useResolvedScheme } from "@/state/theme";

/**
 * TimeBlockEditor — minimal bottom-sheet for adding or editing a
 * single time block (App Blocks page).
 *
 * Visual model is the user's reference (a "prayer locks" style add
 * sheet): a Cancel / title / Save header row, an iOS-spinner time
 * wheel, and a single "Repeat" row that expands inline to reveal a
 * 7-chip weekday selector. Nothing else — no name field, no focus
 * toggle, no per-block apps picker. The apps list is global to the
 * App Blocks page (managed via the "Blocked Apps" card), so the
 * block-creation flow doesn't need to surface it again.
 *
 * Why a new editor instead of reusing StudySessionEditor?
 *   The existing editor is the "deep" editor — name, time, days,
 *   focus opt-in, per-session app curation. The new App Blocks
 *   page asks the user a much simpler question: WHEN do you want
 *   your phone quieted? This editor mirrors that question and
 *   nothing more.
 *
 * The editor never mutates persisted state directly. It composes
 * a payload and hands it off via `onSubmit`, leaving the choice
 * of addSession vs updateSession to the parent.
 */

export type TimeBlockEditorResult = {
  time: { hour: number; minute: number };
  daysOfWeek: WeekdayIndex[];
};

export type TimeBlockEditorProps = {
  visible: boolean;
  /** When present, the editor seeds from this session — used by the
   *  Edit flow (tap an existing row). When absent, the editor seeds
   *  from sensible defaults (8:00 AM every day) for the Add flow. */
  existing?: StudySession;
  onClose: () => void;
  onSubmit: (result: TimeBlockEditorResult) => void | Promise<void>;
};

// LayoutAnimation enablement for Android — no-op on iOS. Guarded so
// hot reloads don't repeatedly flip the experimental flag.
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SMOOTH_LAYOUT = {
  duration: 220,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: { type: LayoutAnimation.Types.easeInEaseOut },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
} as const;

const DEFAULT_DAYS: WeekdayIndex[] = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_TIME = { hour: 8, minute: 0 };

export function TimeBlockEditor({
  visible,
  existing,
  onClose,
  onSubmit,
}: TimeBlockEditorProps) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const { width: screenWidth } = useWindowDimensions();
  const pickerWidth = screenWidth - 32;

  const seed = useCallback((): TimeBlockEditorResult => {
    if (existing) {
      return {
        time: { ...existing.time },
        daysOfWeek: [...existing.daysOfWeek] as WeekdayIndex[],
      };
    }
    return {
      time: { ...DEFAULT_TIME },
      daysOfWeek: [...DEFAULT_DAYS],
    };
  }, [existing]);

  const [draft, setDraft] = useState<TimeBlockEditorResult>(seed);
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reseed whenever the modal becomes visible so reopening with a
  // different target always starts from the right state.
  useEffect(() => {
    if (!visible) return;
    setDraft(seed());
    setRepeatOpen(false);
    setSubmitting(false);
  }, [visible, seed]);

  const canSave = draft.daysOfWeek.length > 0 && !submitting;

  const toggleDay = (day: WeekdayIndex) => {
    LayoutAnimation.configureNext(SMOOTH_LAYOUT);
    setDraft((cur) => {
      const has = cur.daysOfWeek.includes(day);
      const next = has
        ? cur.daysOfWeek.filter((d) => d !== day)
        : ([...cur.daysOfWeek, day] as WeekdayIndex[]);
      next.sort((a, b) => a - b);
      return { ...cur, daysOfWeek: next };
    });
  };

  const setDays = (days: WeekdayIndex[]) => {
    LayoutAnimation.configureNext(SMOOTH_LAYOUT);
    setDraft((cur) => ({
      ...cur,
      daysOfWeek: [...days].sort((a, b) => a - b) as WeekdayIndex[],
    }));
  };

  const openRepeatChooser = () => {
    if (Platform.OS !== "ios") {
      LayoutAnimation.configureNext(SMOOTH_LAYOUT);
      setRepeatOpen((v) => !v);
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ["Every day", "Weekdays", "Weekends", "Custom…", "Cancel"],
        cancelButtonIndex: 4,
        title: "Repeat",
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          setDays([0, 1, 2, 3, 4, 5, 6]);
          setRepeatOpen(false);
        } else if (buttonIndex === 1) {
          setDays([1, 2, 3, 4, 5]);
          setRepeatOpen(false);
        } else if (buttonIndex === 2) {
          setDays([0, 6]);
          setRepeatOpen(false);
        } else if (buttonIndex === 3) {
          LayoutAnimation.configureNext(SMOOTH_LAYOUT);
          setRepeatOpen(true);
        }
      },
    );
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      await onSubmit(draft);
    } finally {
      // Parent closes the sheet on submit; the visibility effect
      // resets submitting back to false on next open.
    }
  };

  // Render the days summary used in the "Repeat" row right-side
  // label. Common patterns collapse to friendly words ("Every day",
  // "Weekdays", "Weekends") so the row reads at a glance.
  const repeatLabel = summarizeDays(draft.daysOfWeek);
  const timeAsDate = toDate(draft.time);

  return (
    <AppleSheet
      visible={visible}
      onClose={onClose}
      // 'auto' covers the collapsed state (header + wheel +
      // repeat row). When the user expands the days chip strip
      // we LayoutAnimation the inside, but the sheet itself
      // doesn't need to resize because the picker dominates the
      // height anyway. Keeping a single detent avoids a
      // confusing magnetic-snap mid-edit.
      detents={["auto"]}
      backgroundColor={colors.bg}
    >
      <View style={{ width: "100%" }}>
        <SheetModalHeader
          title={existing ? "Edit time" : "Add a time"}
          onCancel={onClose}
          onSave={handleSave}
          saveDisabled={!canSave || submitting}
        />

              <View
                style={{
                  width: "100%",
                  alignItems: "center",
                  marginTop: 4,
                  paddingBottom: 4,
                }}
              >
                <DateTimePicker
                  value={timeAsDate}
                  mode="time"
                  display="spinner"
                  onChange={(_e: DateTimePickerEvent, next?: Date) => {
                    if (!next) return;
                    setDraft((cur) => ({
                      ...cur,
                      time: {
                        hour: next.getHours(),
                        minute: next.getMinutes(),
                      },
                    }));
                  }}
                  textColor={colors.ink}
                  themeVariant={scheme === "dark" ? "dark" : "light"}
                  style={{ width: pickerWidth, height: 216 }}
                />
              </View>

              <View style={{ marginTop: 12, paddingHorizontal: 20 }}>
                <Pressable
                  onPress={openRepeatChooser}
                  accessibilityRole="button"
                  accessibilityLabel="Repeat"
                  accessibilityHint="Choose which days this block runs"
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 18,
                      paddingVertical: 14,
                      borderRadius: 16,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: "System",
                        fontWeight: "600",
                        color: colors.ink,
                        fontSize: 16,
                        letterSpacing: -0.2,
                      }}
                    >
                      Repeat
                    </Text>
                    <Text
                      style={{
                        fontFamily: "System",
                        fontWeight: "500",
                        color: colors.inkMuted,
                        fontSize: 14,
                        marginRight: 8,
                      }}
                    >
                      {repeatLabel}
                    </Text>
                    <ChevronIcon
                      stroke={colors.inkSubtle}
                      direction={repeatOpen ? "down" : "right"}
                    />
                  </View>
                </Pressable>

                {/* Expanded day chips. Same DayChip pattern as the
                    deeper StudySessionEditor — seven blue-on-tap
                    pills laid out evenly across the row. */}
                {repeatOpen && (
                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: 10,
                      marginHorizontal: -3,
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
                )}

                {!canSave && (
                  <Text
                    style={{
                      fontFamily: "System",
                      fontWeight: "400",
                      color: colors.inkSubtle,
                      fontSize: 13,
                      lineHeight: 17,
                      marginTop: 10,
                      paddingHorizontal: 4,
                    }}
                  >
                    Pick at least one day for this block.
                  </Text>
                )}
              </View>

              <View style={{ height: 24 }} />
      </View>
    </AppleSheet>
  );
}

// ─────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────

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
  // Wrapper View owns flex distribution (NativeWind interop reliably
  // drops `flex: 1` on Pressable). The Pressable just paints chrome.
  return (
    <View style={{ flex: 1, marginHorizontal: 3 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected }}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <View
          style={{
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: selected
              ? colors.primary
              : withAlphaHex(colors.ink, 0.06),
            borderWidth: selected ? 0 : StyleSheet.hairlineWidth,
            borderColor: withAlphaHex(colors.ink, 0.12),
          }}
        >
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              fontSize: 13,
              color: selected ? "#FFFFFF" : colors.ink,
            }}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function ChevronIcon({
  stroke,
  direction,
}: {
  stroke: string;
  direction: "right" | "down";
}) {
  // Right chevron = closed; down chevron = open. SF Symbols
  // ships purpose-built glyphs for each direction so we avoid
  // any rotation transform — the visual weight (caps, joins)
  // stays canonical in either state.
  return (
    <SFSymbol
      name={direction === "right" ? "chevron.right" : "chevron.down"}
      size={14}
      color={stroke}
      weight="semibold"
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function toDate(time: { hour: number; minute: number }): Date {
  const d = new Date();
  d.setHours(time.hour);
  d.setMinutes(time.minute);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}

/**
 * Friendly one-line description of the chosen days. Collapses the
 * three most common patterns to a single word ("Every day",
 * "Weekdays", "Weekends"); falls back to the canonical short-name
 * list ("Mon, Wed, Fri") for any custom pick.
 */
function summarizeDays(days: ReadonlyArray<number>): string {
  if (days.length === 0) return "Never";
  if (days.length === 7) return "Every day";
  const sorted = [...days].sort();
  const same = (a: number[], b: number[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);
  if (same(sorted, [1, 2, 3, 4, 5])) return "Weekdays";
  if (same(sorted, [0, 6])) return "Weekends";
  const shorts = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return sorted.map((d) => shorts[d]).join(", ");
}

function withAlphaHex(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return hex;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
