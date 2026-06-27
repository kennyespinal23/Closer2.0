import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { AppleSheet } from "@/components/AppleSheet";
import {
  formatReminderTime,
  type DailyReminderTime,
} from "@/lib/notifications";
import { useColors, useResolvedScheme } from "@/state/theme";

/**
 * TimePickerModal — bottom-sheet wheel for picking an arbitrary
 * "Before The Noise" notification time.
 *
 * Both the onboarding step and the in-app /settings/notifications
 * screen use this same component, so any future tweak to the
 * picker (e.g. switching to a different display mode, theming the
 * spinner, swapping the native module) happens in one place.
 *
 * Why a modal instead of inline?
 *   The native iOS spinner is tall — drop it inline into the
 *   onboarding screen and it crowds the moon hero + the preset
 *   chips. A dismissible sheet keeps the screen's hero composition
 *   intact and gives the picker its own moment.
 *
 * Platform behavior:
 *   • iOS — renders the wheel inside an AppleSheet (real
 *           UISheetPresentationController) with explicit "Cancel"
 *           / "Save" buttons. The spinner display mode is
 *           intentional: the compact display opens its own iOS
 *           sheet that fights with ours.
 *   • Android — `display="spinner"` renders the same wheel inside
 *               our sheet, so the visual is consistent. Android
 *               users could ALSO be served the native dialog by
 *               using `display="default"`, but consistency across
 *               platforms reads as more thoughtful UX than
 *               "iOS gets a custom sheet, Android gets the OS
 *               dialog".
 *
 * Confirmation model:
 *   The spinner mutates a local draft as the user dials; the
 *   draft only commits to the parent via onConfirm when Save is
 *   tapped. Cancel discards. This is the iOS-native "you've been
 *   editing — confirm to apply" pattern that users expect from a
 *   time picker.
 */
export type TimePickerModalProps = {
  visible: boolean;
  /** The time to pre-fill the wheel with on open. */
  initial: DailyReminderTime;
  /** Fired when the user taps Save with their final pick. */
  onConfirm: (time: DailyReminderTime) => void;
  /** Fired when the user dismisses (Cancel button OR backdrop tap). */
  onClose: () => void;
};

export function TimePickerModal({
  visible,
  initial,
  onConfirm,
  onClose,
}: TimePickerModalProps) {
  const colors = useColors();
  const scheme = useResolvedScheme();

  // Local draft of the in-progress pick — committed to the parent
  // only on Save. We seed it from `initial` whenever the modal
  // becomes visible so re-opening always starts from the user's
  // current selection rather than a stale prior draft.
  const [draft, setDraft] = useState<DailyReminderTime>(initial);

  useEffect(() => {
    if (visible) setDraft(initial);
  }, [visible, initial]);

  // DateTimePicker speaks Date objects. We convert in both
  // directions at the boundary so the rest of the codebase stays
  // on the simpler { hour, minute } shape.
  const draftAsDate = toDate(draft);

  const handleChange = (
    _event: DateTimePickerEvent,
    next?: Date,
  ) => {
    if (!next) return;
    setDraft({ hour: next.getHours(), minute: next.getMinutes() });
  };

  const handleSave = () => {
    onConfirm(draft);
  };

  return (
    <AppleSheet
      visible={visible}
      onClose={onClose}
      // 'auto' = content-sized. The spinner is ~216pt tall and
      // the header adds another ~50pt, so the sheet lands at a
      // tight, picker-shaped height without any guesswork.
      detents={["auto"]}
      backgroundColor={colors.bg}
    >
      <View>
        {/* Header — Cancel | Title | Save. Mirrors the iOS modal
            header convention so the controls land where muscle
            memory expects them. The grabber pill is supplied by
            AppleSheet at the very top edge, so this header sits
            just below it. */}
        <View className="flex-row items-center px-5 pt-3 pb-2">
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Cancel time picker"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text
              className="text-[15px]"
              style={{
                fontFamily: "System",
                fontWeight: "500",
                color: colors.inkMuted,
              }}
            >
              Cancel
            </Text>
          </Pressable>
          <View className="flex-1 items-center px-3">
            <Text
              className="text-ink text-[14px]"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              Pick your time
            </Text>
            <Text
              className="text-ink-subtle text-[12px] mt-0.5"
              style={{ fontFamily: "System", fontWeight: "500" }}
            >
              {formatReminderTime(draft)}
            </Text>
          </View>
          <Pressable
            onPress={handleSave}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Save time selection"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text
              className="text-[15px]"
              style={{
                fontFamily: "System",
                fontWeight: "700",
                color: colors.primary,
              }}
            >
              Save
            </Text>
          </Pressable>
        </View>

        {/* The wheel itself. textColor only takes effect on iOS —
            Android uses system colors regardless. We pass ink so
            the spinner numerals follow the active theme (light
            text on dark canvas, dark text on light). */}
        <View className="px-4 pb-6">
          <DateTimePicker
            value={draftAsDate}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "spinner"}
            onChange={handleChange}
            textColor={colors.ink}
            // Hint to the native picker which palette to use for
            // non-text elements (iOS divider lines, etc). Without
            // this, an iOS device in system-dark would render
            // bright dividers even when our app is forced light,
            // and vice versa.
            themeVariant={scheme === "dark" ? "dark" : "light"}
            style={{ alignSelf: "stretch" }}
          />
        </View>
      </View>
    </AppleSheet>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Convert our hour/minute shape into a Date object the picker can
 * speak. The calendar date is irrelevant for a "time of day" picker
 * (mode="time"), but the underlying API still needs a real Date.
 * We anchor to today so the picker doesn't try to render a stale
 * 1970-vintage tooltip on platforms that show one.
 */
function toDate(time: DailyReminderTime): Date {
  const d = new Date();
  d.setHours(time.hour);
  d.setMinutes(time.minute);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}
