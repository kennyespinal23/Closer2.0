/** Web OAuth client — used by the app + Supabase Google provider. */
export function getGoogleWebClientId(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
}

/** iOS OAuth client from Google Cloud Console. */
export function getGoogleIosClientId(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
}

/** Reversed iOS client ID for the Expo config plugin URL scheme. */
export function getGoogleIosUrlScheme(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME ?? "";
}

export function isGoogleSignInConfigured(): boolean {
  return getGoogleWebClientId().length > 0;
}
