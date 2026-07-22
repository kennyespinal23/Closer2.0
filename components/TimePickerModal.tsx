import { useEffect, useState } from "react";
import { Platform, View, useWindowDimensions } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { AppleSheet } from "@/components/AppleSheet";
import { SheetModalHeader } from "@/components/SheetModalHeader";
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
  const { width: screenWidth } = useWindowDimensions();
  const pickerWidth = screenWidth - 32;

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
        <SheetModalHeader
          title="Pick your time"
          onCancel={onClose}
          onSave={handleSave}
        />

        <View
          style={{
            alignItems: "center",
            paddingBottom: 24,
          }}
        >
          <DateTimePicker
            value={draftAsDate}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "spinner"}
            onChange={handleChange}
            textColor={colors.ink}
            themeVariant={scheme === "dark" ? "dark" : "light"}
            style={{ width: pickerWidth, height: 216 }}
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
