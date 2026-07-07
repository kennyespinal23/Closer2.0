import { Alert, Text, View } from "react-native";
import {
  SettingsInfoBanner,
  SettingsLinkRow,
  SettingsScaffold,
  SettingsSection,
} from "@/components/SettingsScaffold";
import { SocialButton } from "@/components/SocialButton";
import { isGoogleSignInConfigured } from "@/lib/googleAuthConfig";
import { getSupabaseRedirectUri } from "@/lib/supabaseRedirect";
import { useAuth } from "@/state/auth";

export default function AccountScreen() {
  const {
    configured,
    user,
    signingIn,
    signInWithApple,
    signInWithGoogle,
    signOut,
  } = useAuth();

  const handleSignInError = (err: unknown) => {
    if (err instanceof Error && err.message === "Sign-in was cancelled.") {
      return;
    }
    const message =
      err instanceof Error ? err.message : "Something went wrong. Try again.";
    Alert.alert("Couldn't sign in", message, [{ text: "OK" }]);
  };

  const handleApple = async () => {
    try {
      await signInWithApple();
    } catch (err) {
      handleSignInError(err);
    }
  };

  const handleGoogle = async () => {
    if (!configured) {
      notConfigured();
      return;
    }
    if (!isGoogleSignInConfigured()) {
      Alert.alert(
        "Google isn't ready yet",
        "Finish Google Cloud setup, then paste your client IDs so we can add them to the project.",
        [{ text: "OK" }],
      );
      return;
    }
    try {
      await signInWithGoogle();
    } catch (err) {
      handleSignInError(err);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign out?", "Your data stays on this device until sync ships.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          signOut().catch((err) => handleSignInError(err));
        },
      },
    ]);
  };

  const notConfigured = () =>
    Alert.alert(
      "Almost there",
      "Sign-in isn't connected yet. Restart the app after Supabase is configured.",
      [{ text: "OK" }],
    );

  const signedInLabel =
    user?.email ??
    user?.user_metadata?.full_name ??
    user?.app_metadata?.provider ??
    "Signed in";

  return (
    <SettingsScaffold title="Account">
      <SettingsInfoBanner
        title="One quiet rhythm, every device."
        body={
          user
            ? "You're signed in. Cross-device sync will light up in a follow-up — your highlights and streak still live on this device for now."
            : "Sign in with Apple or Google to carry your highlights, notes, and streak between devices."
        }
      />

      {user ? (
        <SettingsSection title="Signed In">
          <SettingsLinkRow
            label={signedInLabel}
            sublabel="Account connected"
            onPress={handleSignOut}
            destructive
          />
        </SettingsSection>
      ) : (
        <SettingsSection
          title="Sign In"
          footer="Closer works fully offline without an account. Sign-in is for backup and sync across devices."
        >
          <View className="px-4 py-4">
            <SocialButton
              provider="apple"
              onPress={
                configured
                  ? signingIn
                    ? undefined
                    : handleApple
                  : notConfigured
              }
            />
            <View className="h-2.5" />
            <SocialButton
              provider="google"
              onPress={
                configured
                  ? signingIn
                    ? undefined
                    : handleGoogle
                  : notConfigured
              }
            />
          </View>
        </SettingsSection>
      )}

      {!configured && __DEV__ ? (
        <View className="px-6 mt-6">
          <Text
            className="text-ink-subtle text-[12px] leading-[18px] text-center"
            style={{ fontFamily: "System", fontWeight: "400" }}
          >
            Dev: add Supabase env vars, then restart Metro. OAuth redirect:{" "}
            {getSupabaseRedirectUri()}
          </Text>
        </View>
      ) : null}

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
