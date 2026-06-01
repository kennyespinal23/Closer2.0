import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
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
 *   • iOS — renders the wheel inside our SafeAreaView bottom sheet
 *           with explicit "Cancel" / "Save" buttons. The spinner
 *           display mode is intentional: the compact display
 *           opens its own iOS sheet that fights with ours.
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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      // statusBarTranslucent so the dim covers the status bar area
      // on Android — without this a strip stays bright at the top.
      statusBarTranslucent
    >
      {/* Backdrop. Pressable so tapping outside the sheet dismisses
          (matches iOS sheet convention). Inner Pressable swallows
          taps on the sheet itself so they don't bubble up. */}
      <Pressable
        accessibilityLabel="Dismiss"
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            // Subtle top border so the sheet edge has a hairline
            // separation from the dim — most visible in light mode
            // where backdrop and sheet are close in luminance.
            borderTopWidth: 1,
            borderColor: colors.border,
          }}
        >
          <SafeAreaView edges={["bottom"]}>
            {/* Drag indicator — purely cosmetic. The sheet doesn't
                support drag-to-dismiss (just tap-outside or
                Cancel), but the bar is the universal "this is a
                sheet" cue and feels off if it's absent. */}
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

            {/* Header — Cancel | Title | Save. Mirrors the iOS
                modal header convention so the controls land where
                muscle memory expects them. */}
            <View className="flex-row items-center px-5 pt-1 pb-2">
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
                    fontFamily: "PlusJakartaSans_500Medium",
                    color: colors.inkMuted,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
              <View className="flex-1 items-center px-3">
                <Text
                  className="text-ink text-[14px]"
                  style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                >
                  Pick your time
                </Text>
                <Text
                  className="text-ink-subtle text-[11.5px] mt-0.5"
                  style={{ fontFamily: "PlusJakartaSans_500Medium" }}
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
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: colors.primary,
                  }}
                >
                  Save
                </Text>
              </Pressable>
            </View>

            {/* The wheel itself. textColor only takes effect on iOS
                — Android uses system colors regardless. We pass
                ink so the spinner numerals follow the active
                theme (light text on dark canvas, dark text on
                light). The wrapper view fixes the picker's
                vertical breathing room since the native height
                is otherwise a touch cramped against the header. */}
            <View className="px-4 pb-2">
              <DateTimePicker
                value={draftAsDate}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "spinner"}
                onChange={handleChange}
                textColor={colors.ink}
                // Hint to the native picker which palette to use
                // for non-text elements (iOS divider lines, etc).
                // Without this, an iOS device in system-dark would
                // render bright dividers even when our app is
                // forced light, and vice versa.
                themeVariant={scheme === "dark" ? "dark" : "light"}
                style={{ alignSelf: "stretch" }}
              />
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
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
