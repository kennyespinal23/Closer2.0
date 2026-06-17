import { Alert, Text, View } from "react-native";
import {
  SettingsInfoBanner,
  SettingsScaffold,
  SettingsSection,
} from "@/components/SettingsScaffold";
import { SocialButton } from "@/components/SocialButton";

/**
 * Account — sign-in & sync.
 *
 * Linked from the profile drawer's "Email" row. Auth isn't wired
 * yet; this page exists so the row leads somewhere honest instead
 * of nowhere. The three SocialButton affordances render so the
 * screen feels like a real sign-in surface — but tapping any of
 * them surfaces an Alert that names the coming feature, so the
 * user understands we're not stalling, we just haven't shipped it.
 *
 * When auth lands:
 *   • Replace the three Alert handlers with the real sign-in calls
 *   • Move the "Why sign in" copy to a Section footer so it shrinks
 *   • Render a signed-in state (email, "Sign out" row) above the
 *     "Why sign in" copy when `authedUser` is non-null
 *
 * Everything in Closer works fully offline today; sync is purely a
 * "across devices" affordance, so we lead with that promise.
 */
export default function AccountScreen() {
  const notReady = () =>
    Alert.alert(
      "Coming soon",
      "Sign-in arrives in a future update. Until then, everything you read and write stays safely on this device.",
      [{ text: "OK", style: "default" }],
    );

  return (
    <SettingsScaffold title="Account">
      {/* Lead with what sign-in WILL do, framed honestly. We don't
          hide that auth isn't wired — we tell the user what's coming
          and why. Uses the shared SettingsInfoBanner so this screen
          carries the same framing-card treatment as the other
          settings detail pages. */}
      <SettingsInfoBanner
        title="One quiet rhythm, every device."
        body="Sign in to carry your highlights, notes, and streak between your phone and tablet. Until then, everything lives only on this device."
      />

      <SettingsSection
        title="Sign In"
        footer="Closer is fully functional without an account. Sign-in only powers cross-device sync."
      >
        {/* The three SocialButtons live INSIDE the rounded section
            card. To keep the section's padding consistent with other
            settings screens we wrap them in a small inner view with
            its own padding instead of relying on the buttons' default
            spacing. */}
        <View className="px-4 py-4">
          <SocialButton provider="apple" onPress={notReady} />
          <View className="h-2.5" />
          <SocialButton provider="google" onPress={notReady} />
          <View className="h-2.5" />
          <SocialButton provider="email" onPress={notReady} />
        </View>
      </SettingsSection>

      <View className="px-6 mt-8">
        <Text
          className="text-ink-subtle text-[12px] leading-[18px] text-center"
          style={{ fontFamily: "System", fontWeight: "400" }}
        >
          We&apos;ll never email you a newsletter. Sign-in is for sync, nothing else.
        </Text>
      </View>
    </SettingsScaffold>
  );
}
