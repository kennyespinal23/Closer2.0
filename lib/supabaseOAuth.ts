import * as QueryParams from "expo-auth-session/build/QueryParams";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import type { Provider } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { getSupabaseRedirectUri } from "@/lib/supabaseRedirect";

WebBrowser.maybeCompleteAuthSession();

async function createSessionFromUrl(url: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) {
    throw new Error(errorCode);
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  if (!accessToken || !refreshToken) {
    throw new Error("Sign-in did not return a session.");
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw error;
}

/**
 * Apple / Google OAuth. Loaded lazily so email sign-in works on dev
 * builds that predate the expo-web-browser native module.
 */
export async function signInWithOAuthProvider(
  provider: Extract<Provider, "apple" | "google">,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const redirectTo = getSupabaseRedirectUri() || makeRedirectUri({
    scheme: "closer",
    path: "auth/callback",
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data.url) {
    throw new Error("Supabase did not return an OAuth URL.");
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") {
    throw new Error("Sign-in was cancelled.");
  }

  await createSessionFromUrl(result.url);
}
