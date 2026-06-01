/**
 * Focus mode — the "Opal-style" social media shield Closer raises
 * while the user is reading a sermon.
 *
 * ─── Phase 1 (this file) ────────────────────────────────────────
 *
 * Everything here is a stub. `shieldStart` and `shieldStop` resolve
 * immediately and never touch the OS. The UI layer (sermon flow,
 * settings, banner) talks to this module's surface as if blocking
 * were real — that lets us ship the full product story today
 * without waiting on Apple's FamilyControls entitlement queue.
 *
 * The promise of "blocking" in Phase 1 is honor-system: the user
 * commits to a focus session, the banner says it's active, the
 * settings explain which apps are listed. If they jump to Instagram,
 * nothing physically stops them — but they tell themselves they're
 * in a session, and the UX makes that commitment visible.
 *
 * ─── Phase 2 (later) ────────────────────────────────────────────
 *
 * Swap this file for a thin wrapper around `react-native-device-activity`
 * (iOS, FamilyControls + ManagedSettings) and a custom Android module
 * built on UsageStatsManager + AccessibilityService. The public
 * surface (SOCIAL_APPS, shieldStart, shieldStop, isShieldSupported)
 * stays exactly the same so no call site outside this file needs to
 * change. The provider, banner, settings, sermon screens — all
 * untouched.
 *
 * Two things will gate Phase 2:
 *   1. Apple's `com.apple.developer.family-controls` entitlement
 *      (requested via the developer portal — historically multi-day).
 *   2. Switching the build pipeline from Expo Go to a custom
 *      development client (`expo prebuild` + a real native build).
 *
 * Until then, `isShieldSupported()` returns false and the UI shows
 * a quiet "honor-mode" caption so the user isn't misled.
 */

import { Platform } from "react-native";

// ─────────────────────────────────────────────────────────────────
// App catalog
//
// The list of social/entertainment apps the user can pick from in
// the focus picker. Each entry carries enough metadata to render a
// recognizable row (name + brand color) without shipping the actual
// app icon assets (which we'd need licenses for anyway). Phase 2
// will swap this list for whatever FamilyActivityPicker returns on
// iOS — but the public IDs here remain a stable lookup key.
// ─────────────────────────────────────────────────────────────────

export type SocialAppId =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x"
  | "reddit"
  | "facebook"
  | "snapchat"
  | "messages"
  | "whatsapp"
  | "discord"
  | "telegram"
  | "signal"
  | "gmail"
  | "chrome";

export type SocialApp = {
  id: SocialAppId;
  /** Human-readable name shown in the settings row + banner caption. */
  name: string;
  /** Brand color for the leading glyph chip. Approximate is fine —
   *  we're not authenticating the apps, just hinting which one each
   *  row represents. */
  color: string;
  /** Single-character glyph to render in the chip when no real icon
   *  asset is available. Visual hint only; not the source of truth. */
  initial: string;
  /**
   * The "quiet message" shown to the user if they try to open this
   * app during a focus session. Tone is gentle and present-tense —
   * never guilt-inducing, never streak-pressuring. The copy
   * acknowledges the app exists ("Instagram can wait") rather than
   * demonizing it ("Don't get distracted by Instagram").
   *
   * In Phase 1 these messages are previewed in the ShieldOverlay
   * component (settings dev panel + home dev tools). In Phase 2
   * they'll back the iOS ShieldConfiguration extension copy and
   * any Android in-app return overlays the AccessibilityService
   * triggers when a blocked launch is intercepted.
   */
  quietMessage: string;
};

/**
 * Default catalog. Order matters — it's the order rows appear in
 * the picker. We lead with the "big four" attention sinks (Instagram,
 * TikTok, YouTube, X) and follow with the rest.
 */
export const SOCIAL_APPS: ReadonlyArray<SocialApp> = [
  {
    id: "instagram",
    name: "Instagram",
    color: "#E1306C",
    initial: "I",
    quietMessage:
      "Instagram can wait. You're with the Word right now — let this be the only feed for a few minutes.",
  },
  {
    id: "tiktok",
    name: "TikTok",
    color: "#000000",
    initial: "T",
    quietMessage:
      "Pause the scroll. TikTok will be exactly where you left it once the sermon is done.",
  },
  {
    id: "youtube",
    name: "YouTube",
    color: "#FF0000",
    initial: "Y",
    quietMessage:
      "Stay with the verse. Videos will keep — what's in front of you right now matters more.",
  },
  {
    id: "x",
    name: "X",
    color: "#000000",
    initial: "X",
    quietMessage:
      "Set the feed down. Let your mind quiet for a few minutes before the noise returns.",
  },
  {
    id: "reddit",
    name: "Reddit",
    color: "#FF4500",
    initial: "R",
    quietMessage:
      "The threads can wait. You're in a sermon — give yourself permission to be only here.",
  },
  {
    id: "facebook",
    name: "Facebook",
    color: "#1877F2",
    initial: "F",
    quietMessage:
      "The feed will keep. Stay present with what God has for you in the next few minutes.",
  },
  {
    id: "snapchat",
    name: "Snapchat",
    color: "#FFFC00",
    initial: "S",
    quietMessage:
      "Pause the moment. Let this sermon be the only conversation that has your attention right now.",
  },
  {
    id: "messages",
    name: "Messages",
    // The iMessage send-bubble green. Recognizable as "the Messages
    // app" without needing the speech-bubble icon glyph.
    color: "#34DA58",
    initial: "M",
    // Messages is qualitatively different from the social feeds —
    // it's a one-to-one channel, often a lifeline. The copy
    // acknowledges that ("anything urgent will keep") so the user
    // doesn't feel like they're being told to ignore real people;
    // they're being invited to give themselves permission to be
    // unreachable for the few minutes the sermon takes.
    quietMessage:
      "Pause replies. Anything urgent will keep for the few minutes you're here — give yourself permission to be unreachable.",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    color: "#25D366",
    initial: "W",
    quietMessage:
      "Pause the chats. Group threads will keep — let your phone be quiet for these few minutes.",
  },
  {
    id: "discord",
    name: "Discord",
    color: "#5865F2",
    initial: "D",
    quietMessage:
      "Pause Discord. The servers will keep without you — give your attention to the verse instead.",
  },
  {
    id: "telegram",
    name: "Telegram",
    // Telegram's signature sky-blue. The 'T' initial duplicates
    // TikTok's, but the colors (black vs blue) carry the distinction
    // visually — same way Snapchat 'S' and Signal 'S' coexist below.
    color: "#229ED9",
    initial: "T",
    quietMessage:
      "Pause the chats. Any reply can wait until you're done — give yourself this small window of stillness.",
  },
  {
    id: "signal",
    name: "Signal",
    color: "#3A76F0",
    initial: "S",
    quietMessage:
      "Pause replies. You're choosing to be present here — Signal will hold your messages.",
  },
  {
    id: "gmail",
    name: "Gmail",
    color: "#EA4335",
    initial: "G",
    // Email is the trickiest category — work emails feel urgent in
    // a way feeds don't. We lead with "the inbox will keep" to
    // disarm that "what if something important?" reflex, then
    // frame the trade as a deliberate choice rather than a sacrifice.
    quietMessage:
      "The inbox will keep. Nothing in there is more urgent than the next few minutes with the Word.",
  },
  {
    id: "chrome",
    name: "Chrome",
    // Chrome's brand color is technically the four-color logo, but
    // its dominant single-color signature is the blue ring. Using
    // the blue avoids forcing a custom multi-color glyph chip
    // pattern just for one row.
    color: "#4285F4",
    initial: "C",
    quietMessage:
      "Close the tabs. The internet will be exactly where you left it once the sermon is done.",
  },
];

/**
 * The "default checked" set the picker starts with for new installs.
 *
 * Two tiers of opinionation:
 *   • Default-checked: the social feeds and one-to-one chat apps —
 *     everything that's primarily about catching attention. The
 *     user can pare back from this list any time.
 *   • Default-unchecked (but available): Gmail and Chrome. Email
 *     and the browser have legitimate utility (work emails, looking
 *     something up) where a hard block during reading would be
 *     friction rather than focus. Users who want to commit those
 *     too can opt in explicitly.
 *
 * The session state stores its own snapshot of `blockedAppIds` (not
 * a reference to this constant), so changing this default later
 * doesn't retroactively affect existing users' saved preferences.
 */
export const DEFAULT_BLOCKED_APP_IDS: ReadonlyArray<SocialAppId> = [
  // Feeds
  "instagram",
  "tiktok",
  "youtube",
  "x",
  "reddit",
  "facebook",
  "snapchat",
  // Chat
  "messages",
  "whatsapp",
  "discord",
  "telegram",
  "signal",
  // Gmail + Chrome intentionally OMITTED from defaults — see header.
];

/**
 * Lookup helper — returns the catalog entry for an id, or null if
 * the id isn't known. We tolerate unknown ids in saved data because
 * the catalog might grow or shrink between app versions.
 */
export function findSocialApp(id: string): SocialApp | null {
  return SOCIAL_APPS.find((app) => app.id === id) ?? null;
}

// ─────────────────────────────────────────────────────────────────
// Shield interface
// ─────────────────────────────────────────────────────────────────

/**
 * Whether the device can actually block apps right now. Phase 1
 * always returns false — there's no native module wired up yet.
 *
 * Phase 2 will look more like:
 *   • iOS: `await AuthorizationCenter.shared.requestAuthorization()`
 *     then check the result.
 *   • Android: check for UsageStats + Accessibility permission
 *     grants from the user.
 *
 * Call sites use this to decide whether to display "actively
 * blocking" copy or "honor-mode commitment" copy. UI should never
 * lie to the user about whether the shield is real.
 */
export function isShieldSupported(): boolean {
  // Hard-coded false for Phase 1. Don't gate on Platform — the
  // honor-mode UI is identical on both platforms, and the only
  // thing that matters is "is there a real native shield?".
  return false;
}

/**
 * Begin shielding the listed apps. Resolves true if the shield
 * actually went up; false if it failed (permission denied, OS
 * refused, native module missing). The UI should react to the
 * resolved value — false means "we couldn't shield, fall back to
 * honor mode" — but should NOT block the session start on it.
 * The user committed; the session begins regardless of OS support.
 *
 * Phase 1: resolves true immediately. Phase 2: dispatches to the
 * platform-specific shield call.
 */
export async function shieldStart(
  apps: ReadonlyArray<SocialAppId>,
): Promise<boolean> {
  if (!isShieldSupported()) {
    // Honor mode — return success so the caller knows the session
    // started cleanly. The lack of a real shield is communicated
    // through `isShieldSupported()` so the UI can phrase its copy
    // truthfully ("you committed to a session" vs. "apps blocked").
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(
        `[focus] honor-mode shield start (${apps.length} apps, platform ${Platform.OS})`,
      );
    }
    return true;
  }
  // Phase 2 reaches here.
  return false;
}

/**
 * Stop any active shield. Idempotent — safe to call when no shield
 * is active. The session-end flow always calls this even if the
 * shield was honor-mode only, so the data flow stays uniform.
 *
 * Phase 1: resolves immediately. Phase 2: clears ManagedSettings
 * on iOS / unregisters the AccessibilityService callback on
 * Android.
 */
export async function shieldStop(): Promise<void> {
  if (!isShieldSupported()) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log("[focus] honor-mode shield stop");
    }
    return;
  }
  // Phase 2 reaches here.
}

// ─────────────────────────────────────────────────────────────────
// Session helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Max session age before we treat the session as stale and auto-end
 * it on next app foreground. Caps the "user backed out of the
 * sermon and never came back" failure mode — without this the user
 * could be stuck in a "focus is on" state for days.
 *
 * 60 minutes is a generous ceiling — even the longest sermons land
 * around 5–7 minutes, and the user might leave the app idle for a
 * while before returning to finish. Anything longer than an hour
 * is almost certainly an abandoned session.
 */
export const FOCUS_SESSION_MAX_AGE_MS = 60 * 60 * 1000;

/**
 * Compose a one-line caption summarizing the blocked-app list for
 * display in banners and confirmation copy.
 *
 *   ["instagram", "tiktok"]                  → "Instagram & TikTok"
 *   ["instagram", "tiktok", "youtube"]       → "Instagram, TikTok & YouTube"
 *   ["instagram", "tiktok", "youtube", "x"]  → "Instagram, TikTok & 2 more"
 */
export function summarizeBlockedApps(
  ids: ReadonlyArray<string>,
): string {
  const apps = ids.map(findSocialApp).filter((a): a is SocialApp => !!a);
  if (apps.length === 0) return "No apps selected";
  if (apps.length === 1) return apps[0]!.name;
  if (apps.length === 2) return `${apps[0]!.name} & ${apps[1]!.name}`;
  if (apps.length === 3) {
    return `${apps[0]!.name}, ${apps[1]!.name} & ${apps[2]!.name}`;
  }
  return `${apps[0]!.name}, ${apps[1]!.name} & ${apps.length - 2} more`;
}
