import type { ImageSource } from "expo-image";

/**
 * Built-in profile avatars.
 *
 * Sources live in `assets/avatars/` as 512px JPEGs: the felt character
 * set (October 2026), each on its own colour. Selection is persisted as `avatarId` on
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
  | "avatar-10";

export type AvatarOption = {
  id: AvatarId;
  source: ImageSource;
  /** The avatar's background colour. A person's cards wear it. */
  color: string;
};

export const AVATARS: ReadonlyArray<AvatarOption> = [
  { id: "avatar-01", source: require("@/assets/avatars/avatar-01.jpg"), color: "#0D3886" },
  { id: "avatar-02", source: require("@/assets/avatars/avatar-02.jpg"), color: "#311A62" },
  { id: "avatar-03", source: require("@/assets/avatars/avatar-03.jpg"), color: "#10381E" },
  { id: "avatar-04", source: require("@/assets/avatars/avatar-04.jpg"), color: "#FA7475" },
  { id: "avatar-05", source: require("@/assets/avatars/avatar-05.jpg"), color: "#9F0412" },
  { id: "avatar-06", source: require("@/assets/avatars/avatar-06.jpg"), color: "#F1BA1F" },
  { id: "avatar-07", source: require("@/assets/avatars/avatar-07.jpg"), color: "#BA1D6E" },
  { id: "avatar-08", source: require("@/assets/avatars/avatar-08.jpg"), color: "#E26014" },
  { id: "avatar-09", source: require("@/assets/avatars/avatar-09.jpg"), color: "#014047" },
  { id: "avatar-10", source: require("@/assets/avatars/avatar-10.jpg"), color: "#134898" },
];

/** The old set had an eleventh avatar; anyone who chose it keeps a face. */
const RETIRED: Record<string, AvatarId> = { "avatar-11": "avatar-10" };

export function findAvatar(id: string | undefined | null): AvatarOption | null {
  if (!id) return null;
  const current = RETIRED[id] ?? id;
  return AVATARS.find((a) => a.id === current) ?? null;
}

export function isAvatarId(value: string): value is AvatarId {
  return AVATARS.some((a) => a.id === value);
}

/** A stable avatar for a name, so sample and local people always look the same. */
export function avatarForName(name: string): AvatarOption {
  let h = 0;
  for (const ch of name.trim().toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATARS[h % AVATARS.length]!;
}
