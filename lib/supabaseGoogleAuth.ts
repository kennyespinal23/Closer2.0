import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";
import {
  getGoogleIosClientId,
  getGoogleWebClientId,
  isGoogleSignInConfigured,
} from "@/lib/googleAuthConfig";
import { getSupabase } from "@/lib/supabase";

let configured = false;

function ensureGoogleConfigured(): void {
  if (!isGoogleSignInConfigured()) {
    throw new Error(
      "Google Sign In isn't configured yet. Add your Google Web Client ID to .env.",
    );
  }
  if (configured) return;

  const webClientId = getGoogleWebClientId();
  const iosClientId = getGoogleIosClientId();

  GoogleSignin.configure({
    webClientId,
    iosClientId: iosClientId || undefined,
    offlineAccess: false,
  });
  configured = true;
}

/**
 * Native Google Sign-In → Supabase session via ID token.
 * Requires a dev/production build with the Google Sign-In plugin.
 */
export async function signInWithGoogleNative(): Promise<void> {
  ensureGoogleConfigured();

  if (Platform.OS === "android") {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
  }

  const result = await GoogleSignin.signIn();
  if (result.type === "cancelled") {
    throw new Error("Sign-in was cancelled.");
  }

  const idToken = result.data.idToken;
  if (!idToken) {
    throw new Error("Google did not return a sign-in token. Try again.");
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error) throw error;
}
