import { findSocialApp } from "@/lib/focus";

/**
 * Canonical copy for the iOS Screen Time shield and in-app previews.
 * Native ShieldConfiguration reads the strings in configureCloserShieldUI;
 * ShieldScreen / ShieldOverlay read these helpers so every surface matches.
 */

export const SHIELD_EYEBROW = "Focus mode";

/** Native shield title — `{applicationOrDomainDisplayName}` is filled by iOS. */
export const NATIVE_SHIELD_TITLE = "{applicationOrDomainDisplayName} is quiet";

export const NATIVE_SHIELD_SUBTITLE =
  "You're in a moment with God. Open Closer to return to today's word.";

export const NATIVE_SHIELD_PRIMARY_LABEL = "OK";

export function shieldHeadline(appName: string): string {
  return `${appName} is quiet`;
}

export function shieldBodyForApp(appId: string): string {
  const app = findSocialApp(appId);
  return (
    app?.quietMessage ??
    "You're in a moment with God. Come back to Closer when you're done."
  );
}

export function shieldFooterTagline(): string {
  return "A few minutes of stillness, before the noise.";
}
