import type { ImageSource } from "expo-image";

/**
 * Built-in profile avatars.
 *
 * Sources live in `assets/avatars/` as 512px JPEGs (compressed from
 * the App Avatars pack). Selection is persisted as `avatarId` on
 * `OnboardingAnswers` — no remote upload.
 */

export type AvatarId =
  | "avatar-01"
  | "avatar-02"
  | "avatar-03"
  | "avatar-04"
  | "avatar-05"
  | "avatar-06"
  | "avatar-07"
  | "avatar-08"
  | "avatar-09"
  | "avatar-10"
  | "avatar-11";

export type AvatarOption = {
  id: AvatarId;
  source: ImageSource;
};

export const AVATARS: ReadonlyArray<AvatarOption> = [
  { id: "avatar-01", source: require("@/assets/avatars/avatar-01.jpg") },
  { id: "avatar-02", source: require("@/assets/avatars/avatar-02.jpg") },
  { id: "avatar-03", source: require("@/assets/avatars/avatar-03.jpg") },
  { id: "avatar-04", source: require("@/assets/avatars/avatar-04.jpg") },
  { id: "avatar-05", source: require("@/assets/avatars/avatar-05.jpg") },
  { id: "avatar-06", source: require("@/assets/avatars/avatar-06.jpg") },
  { id: "avatar-07", source: require("@/assets/avatars/avatar-07.jpg") },
  { id: "avatar-08", source: require("@/assets/avatars/avatar-08.jpg") },
  { id: "avatar-09", source: require("@/assets/avatars/avatar-09.jpg") },
  { id: "avatar-10", source: require("@/assets/avatars/avatar-10.jpg") },
  { id: "avatar-11", source: require("@/assets/avatars/avatar-11.jpg") },
];

export function findAvatar(id: string | undefined | null): AvatarOption | null {
  if (!id) return null;
  return AVATARS.find((a) => a.id === id) ?? null;
}

export function isAvatarId(value: string): value is AvatarId {
  return AVATARS.some((a) => a.id === value);
}
