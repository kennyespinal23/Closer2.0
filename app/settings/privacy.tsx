import { Alert, Linking, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import {
  SettingsLinkRow,
  SettingsScaffold,
  SettingsSection,
} from "@/components/SettingsScaffold";
import { colors } from "@/constants/theme";
import { useAnnotations } from "@/state/annotations";
import { useCheckIns } from "@/state/checkIns";
import { useOnboarding } from "@/state/onboarding";
import { usePreferences } from "@/state/preferences";
import { useProgress } from "@/state/progress";

const PRIVACY_URL = "https://closer.app/privacy";
const TERMS_URL = "https://closer.app/terms";

/**
 * Privacy & Data screen.
 *
 * The two destructive rows are wired to real provider resets:
 *   • Reset Onboarding  → clears onboarding answers, replaces to /start
 *   • Delete Account    → clears both onboarding + progress, back to /start
 *
 * Both go through Alert.alert so an accidental tap can't nuke
 * someone's state. Once we wire AsyncStorage persistence and an
 * actual account backend, these handlers stay the same — the
 * providers' reset() functions will just do more.
 */
export default function PrivacyScreen() {
  const router = useRouter();
  const onboarding = useOnboarding();
  const progress = useProgress();
  const preferences = usePreferences();
  const annotations = useAnnotations();
  const checkIns = useCheckIns();

  const confirmResetOnboarding = () => {
    Alert.alert(
      "Reset onboarding?",
      "We'll walk you through the welcome flow again. Your progress and completions will stay where they are.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            onboarding.reset();
            router.replace("/start");
          },
        },
      ],
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete your account?",
      "This clears every sermon you've completed, every preference, and walks you back to the very beginning. There's no undo.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // True full wipe — clears every persistence-backed
            // provider AND its on-disk AsyncStorage entry.
            onboarding.reset();
            progress.reset();
            preferences.reset();
            annotations.reset();
            checkIns.reset();
            router.replace("/start");
          },
        },
      ],
    );
  };

  return (
    <SettingsScaffold title="Privacy">
      {/* ─── The Promise ────────────────────────────────────────
          The first thing someone reads on the Privacy page should
          tell them what we *don't* do. The fine print can wait. */}
      <View className="px-6 mt-2">
        <View className="rounded-2xl border border-border bg-surface px-5 py-6">
          <Text
            className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase mb-3"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            Closer&apos;s Promise
          </Text>
          <Text
            className="text-ink text-[15.5px] leading-[23px] tracking-[-0.1px]"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            We don&apos;t sell your data. We don&apos;t serve ads. We don&apos;t
            track what you read for any reason but to give you back your
            progress.
          </Text>
          <Text
            className="text-ink-muted text-[13.5px] leading-[20px] mt-3"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          >
            Your relationship with scripture is yours. We&apos;re just a
            doorway you walk through each morning.
          </Text>
        </View>
      </View>

      <SettingsSection
        title="What We Collect"
        footer="Stored locally on this device. Nothing leaves your phone without your sign-in."
      >
        <SettingsLinkRow
          icon={<JournalIcon />}
          label="Sermons Completed"
          sublabel="To show your rhythm and unlock the Library"
          showDivider
        />
        <SettingsLinkRow
          icon={<NameIcon />}
          label="Your Name"
          sublabel="So we can greet you each morning"
          showDivider
        />
        <SettingsLinkRow
          icon={<DeviceIcon />}
          label="Device Identifier"
          sublabel="Used only for crash diagnostics"
        />
      </SettingsSection>

      <SettingsSection title="The Fine Print">
        <SettingsLinkRow
          icon={<DocIcon />}
          label="Privacy Policy"
          onPress={() => Linking.openURL(PRIVACY_URL)}
          showDivider
        />
        <SettingsLinkRow
          icon={<DocIcon />}
          label="Terms of Service"
          onPress={() => Linking.openURL(TERMS_URL)}
        />
      </SettingsSection>

      <SettingsSection
        title="Your Data, Your Call"
        footer="These actions cannot be undone."
      >
        <SettingsLinkRow
          icon={<RefreshIcon />}
          label="Reset Onboarding"
          sublabel="Walk through the welcome flow again"
          onPress={confirmResetOnboarding}
          showDivider
        />
        <SettingsLinkRow
          icon={<DownloadIcon />}
          label="Export My Data"
          sublabel="Coming soon"
          onPress={() => {}}
          showDivider
        />
        <SettingsLinkRow
          icon={<TrashIcon destructive />}
          label="Delete Account"
          sublabel="Erase everything on this device"
          onPress={confirmDeleteAccount}
          destructive
        />
      </SettingsSection>

      <View className="px-6 mt-8">
        <Text
          className="text-ink-subtle text-[12px] leading-[18px] text-center"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          Built with care. Questions? Reach us through Help &amp; Support.
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

function JournalIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4" {...ICON_PROPS} />
    </Svg>
  );
}

function NameIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-7 8-7s8 3 8 7" {...ICON_PROPS} />
    </Svg>
  );
}

function DeviceIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M7 3h10v18H7zM10 18h4" {...ICON_PROPS} />
    </Svg>
  );
}

function DocIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M6 3h9l3 3v15H6zM15 3v3h3" {...ICON_PROPS} />
    </Svg>
  );
}

function RefreshIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M4 4v6h6M20 20v-6h-6" {...ICON_PROPS} />
      <Path d="M5 13a8 8 0 0014-4M19 11a8 8 0 00-14 4" {...ICON_PROPS} />
    </Svg>
  );
}

function DownloadIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M12 4v12M7 11l5 5 5-5M4 20h16" {...ICON_PROPS} />
    </Svg>
  );
}

function TrashIcon({ destructive }: { destructive?: boolean }) {
  const stroke = destructive ? "#FF6B6B" : colors.ink;
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M4 6h16M9 6V4h6v2M6 6l1 14h10l1-14M10 11v5M14 11v5"
        stroke={stroke}
        strokeWidth={1.7}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
