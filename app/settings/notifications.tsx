import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { SFSymbol } from "@/components/Symbol";
import {
  SettingsScaffold,
  SettingsSection,
  SettingsLinkRow,
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
          <SettingsLinkRow
            label="Reminder time"
            sublabel="Opens the native time picker"
            value={formatReminderTime(time)}
            onPress={() => setPickerOpen(true)}
          />
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
          className="text-ink-muted text-[12px] leading-[18px] text-center"
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
            className="text-ink-muted text-[11px] ml-2"
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

function SunriseIcon() {
  const { ink } = useColors();
  return <SFSymbol name="sunrise" size={14} color={ink} weight="medium" />;
}

function BellIcon() {
  const { ink } = useColors();
  return <SFSymbol name="bell" size={14} color={ink} weight="medium" />;
}

function ExternalIcon() {
  const { ink } = useColors();
  return <SFSymbol name="arrow.up.right.square" size={14} color={ink} weight="medium" />;
}
