import { findSocialApp } from "@/lib/focus";

/**
 * Canonical copy for the iOS Screen Time shield and in-app previews.
 * Native ShieldConfiguration reads these via configureCloserShieldUI;
 * ShieldScreen / ShieldOverlay read the same helpers so every surface matches.
 *
 * Two primary-button paths (pick at configure time from notification
 * permission — never silently no-op):
 *
 *   • granted  → fire an immediate local notification; tap opens /today
 *   • denied   → honest “open Closer yourself” copy; button only dismisses
 */

export const SHIELD_EYEBROW = "Focus mode";

/** Native shield title — `{applicationOrDomainDisplayName}` is filled by iOS. */
export const NATIVE_SHIELD_TITLE = "{applicationOrDomainDisplayName} is quiet";

/** @deprecated Prefer notify vs manual variants. */
export const NATIVE_SHIELD_SUBTITLE =
  "You're in a moment with God. Open Closer to return to today's word.";

/** Permission granted — banner will appear when they tap the button. */
export const NATIVE_SHIELD_SUBTITLE_NOTIFY =
  "You're in a moment with God. Tap Continue, then tap the banner to open today's word.";

/** Permission denied / undetermined — no silent failure; tell them what to do. */
export const NATIVE_SHIELD_SUBTITLE_MANUAL =
  "You're in a moment with God. Open the Closer app for today's word.";

export const NATIVE_SHIELD_PRIMARY_NOTIFY = "Continue";
export const NATIVE_SHIELD_PRIMARY_MANUAL = "Got it";

/** @deprecated Prefer NATIVE_SHIELD_PRIMARY_NOTIFY / _MANUAL. */
export const NATIVE_SHIELD_PRIMARY_LABEL = NATIVE_SHIELD_PRIMARY_NOTIFY;

/** Local-notification payload when the shield primary fires (permission granted). */
export const SHIELD_RETURN_NOTIFICATION = {
  title: "Closer",
  body: "Continue today's reading.",
  kind: "shield-return" as const,
  route: "/today" as const,
} as const;

export type ShieldPrimaryPath = "notify" | "manual";

export function shieldNativeSubtitle(path: ShieldPrimaryPath): string {
  return path === "notify"
    ? NATIVE_SHIELD_SUBTITLE_NOTIFY
    : NATIVE_SHIELD_SUBTITLE_MANUAL;
}

export function shieldPrimaryLabel(path: ShieldPrimaryPath): string {
  return path === "notify"
    ? NATIVE_SHIELD_PRIMARY_NOTIFY
    : NATIVE_SHIELD_PRIMARY_MANUAL;
}

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

/** Body line for in-app shield preview — mirrors native subtitle path. */
export function shieldBodyForPath(
  path: ShieldPrimaryPath,
  appId?: string,
): string {
  if (path === "notify") return NATIVE_SHIELD_SUBTITLE_NOTIFY;
  if (path === "manual") return NATIVE_SHIELD_SUBTITLE_MANUAL;
  return appId ? shieldBodyForApp(appId) : NATIVE_SHIELD_SUBTITLE_MANUAL;
}

export function shieldFooterTagline(): string {
  return "A few minutes of stillness, before the noise.";
}
