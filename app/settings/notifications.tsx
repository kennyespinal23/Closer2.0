import { useState } from "react";
import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  SettingsLinkRow,
  SettingsScaffold,
  SettingsSection,
  SettingsToggleRow,
} from "@/components/SettingsScaffold";
import { colors } from "@/constants/theme";

/**
 * Notification preferences.
 *
 * State lives in local component state for now — we don't have a
 * settings store yet, and there's no real notification scheduler
 * wired up either. The toggles are functional UI but persisted to
 * memory only; when we add an AsyncStorage-backed preferences
 * provider, lift this state up unchanged.
 */
export default function NotificationsScreen() {
  const [dailyReminder, setDailyReminder] = useState(true);
  const [verseOfDay, setVerseOfDay] = useState(true);
  const [gentleNudges, setGentleNudges] = useState(false);
  const [streakNudge, setStreakNudge] = useState(true);
  const [weeklyReflection, setWeeklyReflection] = useState(false);

  return (
    <SettingsScaffold title="Notifications">
      {/* Quiet preamble — sets the tone for what these toggles mean.
          Notifications in Closer are framed as invitations, not nags. */}
      <View className="px-6 pt-2 pb-2">
        <Text
          className="text-ink-muted text-[14px] leading-[21px]"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          Closer will never buzz you for engagement. Every notification
          here is a doorway back to stillness — nothing more.
        </Text>
      </View>

      <SettingsSection
        title="Daily Rhythm"
        footer="One reminder a day, at a time that fits your morning."
      >
        <SettingsToggleRow
          icon={<SunriseIcon />}
          label="Daily Sermon Reminder"
          sublabel="A nudge to begin your time today"
          value={dailyReminder}
          onValueChange={setDailyReminder}
          showDivider
        />
        <SettingsLinkRow
          icon={<ClockIcon />}
          label="Reminder Time"
          value="7:30 AM"
          onPress={() => {}}
        />
      </SettingsSection>

      <SettingsSection
        title="Throughout Your Day"
        footer="Optional — quiet moments to look up from the noise."
      >
        <SettingsToggleRow
          icon={<VerseIcon />}
          label="Verse of the Day"
          sublabel="One verse, delivered at noon"
          value={verseOfDay}
          onValueChange={setVerseOfDay}
          showDivider
        />
        <SettingsToggleRow
          icon={<PauseIcon />}
          label="Gentle Nudges"
          sublabel="Three short pauses spread across the afternoon"
          value={gentleNudges}
          onValueChange={setGentleNudges}
        />
      </SettingsSection>

      <SettingsSection
        title="Your Journey"
        footer="Closer will not shame you for missing a day. These are warm-only."
      >
        <SettingsToggleRow
          icon={<FlameIcon />}
          label="Rhythm Encouragement"
          sublabel="A note when your week is taking shape"
          value={streakNudge}
          onValueChange={setStreakNudge}
          showDivider
        />
        <SettingsToggleRow
          icon={<ReflectIcon />}
          label="Weekly Reflection"
          sublabel="A Sunday-evening look back on your week"
          value={weeklyReflection}
          onValueChange={setWeeklyReflection}
        />
      </SettingsSection>

      <View className="px-6 mt-8">
        <Text
          className="text-ink-subtle text-[12px] leading-[18px] text-center"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          You can mute everything from your phone&apos;s Settings app at any time.
        </Text>
      </View>
    </SettingsScaffold>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

const ICON_PROPS = {
  strokeWidth: 1.7,
  stroke: colors.ink,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function SunriseIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M12 14a4 4 0 014 4H8a4 4 0 014-4z" {...ICON_PROPS} />
      <Path d="M3 18h18M12 4v2M5 7l1.5 1.5M19 7l-1.5 1.5" {...ICON_PROPS} />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" {...ICON_PROPS} />
      <Path d="M12 7v5l3 2" {...ICON_PROPS} />
    </Svg>
  );
}

function VerseIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M4 5h6a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-6a2 2 0 00-2 2v12a2 2 0 012-2h6z" {...ICON_PROPS} />
    </Svg>
  );
}

function PauseIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M9 5v14M15 5v14" {...ICON_PROPS} />
    </Svg>
  );
}

function FlameIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M12 3c2 3 5 5 5 9a5 5 0 11-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-8z"
        {...ICON_PROPS}
      />
    </Svg>
  );
}

function ReflectIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" {...ICON_PROPS} />
      <Path d="M12 12a3 3 0 100-6 3 3 0 000 6z" {...ICON_PROPS} />
    </Svg>
  );
}
