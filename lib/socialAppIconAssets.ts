import type { ImageSource } from "expo-image";

/**
 * Official App Store artwork for blockable apps.
 *
 * Sourced via Apple's iTunes Search API (`artworkUrl512`) and
 * bundled locally so the landing page renders real iOS app icons
 * without a network round-trip. Apple does not expose SF Symbols
 * or a public API for third-party app icons — this is the same
 * artwork users see on the App Store.
 */
export const SOCIAL_APP_ICON_SOURCES = {
  instagram: require("@/assets/app-icons/instagram.png"),
  tiktok: require("@/assets/app-icons/tiktok.png"),
  youtube: require("@/assets/app-icons/youtube.png"),
  x: require("@/assets/app-icons/x.png"),
  snapchat: require("@/assets/app-icons/snapchat.png"),
  facebook: require("@/assets/app-icons/facebook.png"),
  discord: require("@/assets/app-icons/discord.png"),
  reddit: require("@/assets/app-icons/reddit.png"),
} satisfies Record<string, ImageSource>;

export type SocialAppKind = keyof typeof SOCIAL_APP_ICON_SOURCES;