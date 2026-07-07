import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import { getSupabase } from "@/lib/supabase";

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  return AppleAuthentication.isAvailableAsync();
}

/**
 * Native Sign in with Apple → Supabase session via identity token.
 * Requires:
 *   • iOS dev/production build (not Expo Go)
 *   • Sign in with Apple enabled on the App ID in Apple Developer
 *   • Supabase Auth → Apple → Client IDs includes com.espinalcapital.closer
 */
export async function signInWithAppleNative(): Promise<void> {
  if (Platform.OS !== "ios") {
    throw new Error("Sign in with Apple is only available on iPhone.");
  }

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error(
      "Sign in with Apple isn't available on this device. Use a physical iPhone with a fresh dev build.",
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (err) {
    if (
      err instanceof Error &&
      "code" in err &&
      err.code === "ERR_REQUEST_CANCELED"
    ) {
      throw new Error("Sign-in was cancelled.");
    }
    throw err;
  }

  if (!credential.identityToken) {
    throw new Error("Apple did not return a sign-in token. Try again.");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });
  if (error) throw error;
}
