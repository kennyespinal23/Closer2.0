import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  SettingsScaffold,
  SettingsSection,
  SettingsToggleRow,
} from "@/components/SettingsScaffold";
import { TimePickerModal } from "@/components/TimePickerModal";
import { useColors } from "@/state/theme";
import {
  BEFORE_THE_NOISE,
  cancelDailyReminder,
  DEFAULT_REMINDER_TIME,
  fireTestReminderNow,
  formatReminderTime,
  getNotificationPermission,
  requestNotificationPermission,
  scheduleDailyReminder,
  type DailyReminderTime,
  type NotificationPermissionStatus,
} from "@/lib/notifications";
import { useOnboarding } from "@/state/onboarding";

/**
 * Notification preferences — the "Before The Noise" daily ritual.
 *
 * The product has exactly ONE notification: a daily morning beacon
 * that opens straight into the sermon. The settings surface reflects
 * that — there's no "throughout the day" section, no verse-of-day
 * toggle, no weekly reflection. Stripping the surface down to a
 * single toggle + time picker is the design.
 *
 * State source of truth lives in OnboardingAnswers (the same place
 * the onboarding picker writes to). Any change here calls into
 * `scheduleDailyReminder` / `cancelDailyReminder` so the OS-level
 * schedule stays in sync with the persisted preference.
 *
 * Permission handling:
 *   • undetermined → "Enable" prompts the system dialog
 *   • granted      → toggle works, time picker is live
 *   • denied       → toggle is disabled with a deep link to
 *                    iOS Settings.app (the only way to recover
 *                    from a hard deny without uninstalling)
 */
export default function NotificationsScreen() {
  const { answers, setAnswer } = useOnboarding();
  const [permission, setPermission] =
    useState<NotificationPermissionStatus>("undetermined");
  const [busy, setBusy] = useState(false);
  // Custom-time picker visibility. Opens via the Custom chip in
  // the Time row; closes on Save (commits the picked time) or
  // Cancel (no-op).
  const [pickerOpen, setPickerOpen] = useState(false);

  const enabled = answers.notificationsEnabled ?? false;
  const time = answers.dailyReminderTime ?? DEFAULT_REMINDER_TIME;

  // True when the active time isn't one of the chip presets —
  // tells the chip row to highlight the Custom chip and surface
  // the picked time as its label.
  const isCustomTime = useMemo(
    () =>
      !ALL_PRESETS.some(
        (p) => p.hour === time.hour && p.minute === time.minute,
      ),
    [time],
  );

  // Read permission on mount so the disabled / "Open Settings"
  // state on the toggle is accurate even before the user interacts.
  useEffect(() => {
    let cancelled = false;
    getNotificationPermission().then((p) => {
      if (!cancelled) setPermission(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = useCallback(
    async (next: boolean) => {
      if (busy) return;
      setBusy(true);
      try {
        if (next) {
          const status = await requestNotificationPermission();
          setPermission(status);
          if (status !== "granted") {
            // Don't flip the toggle on if the OS said no — leave the
            // user with a clear "tap Open Settings" affordance below.
            setAnswer("notificationsEnabled", false);
            return;
          }
          await scheduleDailyReminder(time);
          setAnswer("notificationsEnabled", true);
          // Persist the time too, in case it wasn't set by a prior
          // onboarding pass (e.g. user "Maybe later"ed and is now
          // turning it on for the first time from settings).
          setAnswer("dailyReminderTime", time);
        } else {
          await cancelDailyReminder();
          setAnswer("notificationsEnabled", false);
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, time, setAnswer],
  );

  const handlePickTime = useCallback(
    async (next: DailyReminderTime) => {
      setAnswer("dailyReminderTime", next);
      // If notifications are already on, immediately reschedule so
      // the OS schedule matches the new pick — no Save button.
      if (enabled && permission === "granted") {
        await scheduleDailyReminder(next);
      }
    },
    [enabled, permission, setAnswer],
  );

  const handleOpenSystemSettings = useCallback(() => {
    // iOS will launch the per-app Settings page. From there the
    // user can re-grant notification permission, which we'll pick
    // up on next mount via getNotificationPermission().
    Linking.openSettings().catch(() => {});
  }, []);

  return (
    <SettingsScaffold title="Notifications">
      {/* Quiet preamble — sets the tone for what these toggles mean.
          Notifications in Closer are framed as invitations, not nags. */}
      <View className="px-6 pt-2 pb-2">
        <Text
          className="text-ink-muted text-[14px] leading-[21px]"
          style={{ fontFamily: "System", fontWeight: "400" }}
        >
          One notification a day, at a time you choose. Tap it and the
          sermon is already waiting. Closer never sends anything else.
        </Text>
      </View>

      <SettingsSection
        title="Before The Noise"
        footer={
          permission === "denied"
            ? "Notifications are off at the system level. Open Settings to turn them back on."
            : "Closer will never shame you for missing a day. The notification is an invitation, not a nag."
        }
      >
        <SettingsToggleRow
          icon={<SunriseIcon />}
          label="Daily reminder"
          sublabel={
            enabled
              ? `Fires every day at ${formatReminderTime(time)}`
              : "One quiet moment, every morning"
          }
          value={enabled}
          onValueChange={handleToggle}
          showDivider
        />

        {/* When notifications are denied at the OS level we surface
            a soft inline CTA to recover. */}
        {permission === "denied" && (
          <Pressable
            onPress={handleOpenSystemSettings}
            className="px-4 py-3 flex-row items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <ExternalIcon />
            <Text
              className="text-ink text-[14px] ml-2.5"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              Open Settings
            </Text>
          </Pressable>
        )}

        {/* Time picker — surfaces inline below the toggle so the
            user can adjust without drilling into a sub-screen. Only
            visible when the reminder is actually enabled. */}
        {enabled && permission === "granted" && (
          <View className="px-4 pt-4 pb-4">
            <Text
              className="text-ink-subtle text-[11px] tracking-[2px] uppercase mb-3"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              Time
            </Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {ALL_PRESETS.map((preset) => {
                // A preset chip is "selected" only when the active
                // time matches the preset AND no custom time is
                // active. (Custom times that happen to equal a
                // preset are treated as that preset by isCustomTime,
                // so this check is redundant-safe but explicit.)
                const selected =
                  !isCustomTime &&
                  preset.hour === time.hour &&
                  preset.minute === time.minute;
                return (
                  <TimeChip
                    key={`${preset.hour}-${preset.minute}`}
                    label={formatReminderTime(preset)}
                    selected={selected}
                    onPress={() => handlePickTime(preset)}
                  />
                );
              })}
              {/* Custom chip — opens the wheel modal. Same
                  pattern as the onboarding screen so the picker
                  feels like the same affordance in both places. */}
              <CustomTimeChip
                selected={isCustomTime}
                label={
                  isCustomTime ? formatReminderTime(time) : "Custom"
                }
                onPress={() => setPickerOpen(true)}
              />
            </View>
          </View>
        )}
      </SettingsSection>

      {/* Live preview of the notification copy so the user knows
          exactly what they'll see. Keeping copy authoritative here
          (instead of duplicating it) means any future copy tweak
          in lib/notifications.ts shows up automatically. */}
      <SettingsSection title="How it looks">
        <View className="px-4 py-4">
          <NotificationPreview
            title={BEFORE_THE_NOISE.title}
            body={BEFORE_THE_NOISE.body}
          />
        </View>
      </SettingsSection>

      {__DEV__ && (
        <SettingsSection
          title="Dev"
          footer="Fires a single notification in 2 seconds. Background the app to see the lock-screen banner."
        >
          <Pressable
            onPress={() => {
              fireTestReminderNow().catch(() => {});
            }}
            className="px-4 py-3.5 flex-row items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <BellIcon />
            <Text
              className="text-ink text-[14px] ml-2.5"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              Fire test notification
            </Text>
          </Pressable>
        </SettingsSection>
      )}

      <View className="px-6 mt-6">
        <Text
          className="text-ink-subtle text-[12px] leading-[18px] text-center"
          style={{ fontFamily: "System", fontWeight: "400" }}
        >
          You can mute everything from your phone&apos;s Settings app at any time.
        </Text>
      </View>

      {/* Custom time picker. Mounted at the scaffold root so the
          sheet floats over the entire settings surface. */}
      <TimePickerModal
        visible={pickerOpen}
        initial={time}
        onConfirm={(next) => {
          handlePickTime(next);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </SettingsScaffold>
  );
}

// ─────────────────────────────────────────────────────────────────
// Time picker chips — a wider set than onboarding (every 30 min
// from 5:00 AM → 9:30 AM, plus a few late-night times) so settings
// can accommodate non-morning rhythms onboarding doesn't optimize for.
// ─────────────────────────────────────────────────────────────────

const ALL_PRESETS: ReadonlyArray<DailyReminderTime> = [
  { hour: 5, minute: 30 },
  { hour: 6, minute: 0 },
  { hour: 6, minute: 30 },
  { hour: 7, minute: 0 },
  { hour: 7, minute: 30 },
  { hour: 8, minute: 0 },
  { hour: 8, minute: 30 },
  { hour: 9, minute: 0 },
  { hour: 9, minute: 30 },
  { hour: 22, minute: 0 },
  { hour: 22, minute: 30 },
  { hour: 23, minute: 0 },
];

function TimeChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Set time to ${label}`}
      accessibilityState={{ selected }}
      className="rounded-full px-3.5 py-2 border"
      style={({ pressed }) => ({
        backgroundColor: selected ? colors.primary : "transparent",
        borderColor: selected ? colors.primary : colors.borderStrong,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        className="text-[13px] tracking-[-0.1px]"
        style={{
          fontFamily: "System",
          fontWeight: "700",
          color: selected ? colors.primaryFg : colors.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Custom-time chip — opens the bottom-sheet wheel picker. When
 * a custom time has been picked, the chip shows that time so the
 * user can see what they've set; otherwise it reads "Custom" with
 * a leading clock glyph hinting "this opens a chooser". Mirrors
 * the same component on the onboarding screen for visual + interaction
 * consistency across the two surfaces that own this setting.
 */
function CustomTimeChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        selected ? `Custom time: ${label}. Tap to change.` : "Pick a custom time"
      }
      accessibilityState={{ selected }}
      className="rounded-full pl-2.5 pr-3.5 py-2 border flex-row items-center"
      style={({ pressed }) => ({
        backgroundColor: selected ? colors.primary : "transparent",
        borderColor: selected ? colors.primary : colors.borderStrong,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {selected ? (
        <PencilGlyph stroke={selected ? colors.primaryFg : colors.ink} />
      ) : (
        <ClockGlyph stroke={selected ? colors.primaryFg : colors.ink} />
      )}
      <Text
        className="text-[13px] tracking-[-0.1px] ml-1.5"
        style={{
          fontFamily: "System",
          fontWeight: "700",
          color: selected ? colors.primaryFg : colors.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ClockGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
        stroke={stroke}
        strokeWidth={1.7}
      />
      <Path
        d="M12 7v5l3 2"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PencilGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20l4-1 11-11-3-3L5 16zM14 5l3 3"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// NotificationPreview — a tiny mock of the iOS notification UI so
// the user can see exactly what arrives on their lock screen
// ─────────────────────────────────────────────────────────────────

function NotificationPreview({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const colors = useColors();
  return (
    <View
      className="rounded-2xl px-4 py-3.5 flex-row items-start"
      style={{
        // Quiet wash that reads above colors.surface in both themes.
        // Ink-tinted (not pure-white) so it still has contrast on
        // the light theme's near-white surface.
        backgroundColor: withInkAlpha(colors.ink, 0.05),
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* "App icon" placeholder — a small filled square with the
          accent color, mirroring how an actual app icon would sit
          in the iOS notification stack. */}
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: colors.accentSoft }}
      >
        <Text
          className="text-primary text-[14px]"
          style={{ fontFamily: "System", fontWeight: "800" }}
        >
          C
        </Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-baseline justify-between">
          <Text
            className="text-ink text-[13px]"
            style={{ fontFamily: "System", fontWeight: "700" }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            className="text-ink-subtle text-[11px] ml-2"
            style={{ fontFamily: "System", fontWeight: "500" }}
          >
            now
          </Text>
        </View>
        <Text
          className="text-ink-muted text-[13px] mt-0.5"
          style={{ fontFamily: "System", fontWeight: "400" }}
          numberOfLines={2}
        >
          {body}
        </Text>
      </View>
    </View>
  );
}

/**
 * Compose an alpha into a `#RRGGBB` hex string, returning a CSS
 * `rgba(r, g, b, a)` string usable by RN's color props. Falls back
 * to the input untouched when the hex doesn't parse cleanly. Same
 * helper SettingsScaffold uses for the off-track switch; duplicated
 * here to keep this module self-contained for the preview card.
 */
function withInkAlpha(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return hex;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

const ICON_PROPS_BASE = {
  strokeWidth: 1.7,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function SunriseIcon() {
  const { ink } = useColors();
  const props = { ...ICON_PROPS_BASE, stroke: ink };
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M12 14a4 4 0 014 4H8a4 4 0 014-4z" {...props} />
      <Path d="M3 18h18M12 4v2M5 7l1.5 1.5M19 7l-1.5 1.5" {...props} />
    </Svg>
  );
}

function BellIcon() {
  const { ink } = useColors();
  const props = { ...ICON_PROPS_BASE, stroke: ink };
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M18 16v-5a6 6 0 10-12 0v5l-2 2h16zM10 21a2 2 0 004 0"
        {...props}
      />
    </Svg>
  );
}

function ExternalIcon() {
  const { ink } = useColors();
  const props = { ...ICON_PROPS_BASE, stroke: ink };
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M14 4h6v6M10 14L20 4M19 13v6H5V5h6" {...props} />
    </Svg>
  );
}
