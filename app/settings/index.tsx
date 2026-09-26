import { useRouter, type Href } from "expo-router";
import { SettingsScaffold, SettingsSection, SettingsLinkRow, SettingsStaticRow } from "@/components/SettingsScaffold";
import { useOnboarding } from "@/state/onboarding";
import { useTheme } from "@/state/theme";

export default function SettingsIndex() {
  const router = useRouter();
  const { answers } = useOnboarding();
  const { pref } = useTheme();
  const open = (path: Href) => router.push(path);
  return <SettingsScaffold title="Settings">
    <SettingsSection title="Account">
      <SettingsLinkRow label="Your name" value={answers.name || "Your name"} onPress={() => open("/settings/name")} showDivider />
      <SettingsLinkRow label="Account & email" onPress={() => open("/settings/account")} />
    </SettingsSection>
    <SettingsSection title="Preferences">
      <SettingsLinkRow label="Notifications" onPress={() => open("/settings/notifications")} showDivider />
      <SettingsLinkRow label="Appearance" value={pref === "system" ? "System" : pref === "light" ? "Light" : "Dark"} onPress={() => open("/settings/appearance")} />
    </SettingsSection>
    <SettingsSection title="About">
      <SettingsLinkRow label="Help & support" onPress={() => open("/settings/help")} showDivider />
      <SettingsLinkRow label="Privacy" onPress={() => open("/settings/privacy")} showDivider />
      <SettingsLinkRow label="Developer Tools" onPress={() => open("/settings/developer")} showDivider />
      <SettingsStaticRow label="Version" value="0.1.0" />
    </SettingsSection>
  </SettingsScaffold>;
}
