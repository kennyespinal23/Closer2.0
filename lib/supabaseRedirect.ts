import * as Linking from "expo-linking";

/** Deep-link URL to allow in Supabase → Auth → URL configuration. */
export function getSupabaseRedirectUri(): string {
  return Linking.createURL("auth/callback");
}
