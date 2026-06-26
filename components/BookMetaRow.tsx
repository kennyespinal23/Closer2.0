import { View } from "react-native";
import { EmojiMetaThemed } from "@/components/EmojiMeta";

type BookMetaRowProps = {
  chapters: number;
  readMinutes: number;
  testamentLabel: string;
  category: string;
  order: number;
  mutedColor: string;
};

/** Home-hero-style metadata row for book preview screens. */
export function BookMetaRow({
  chapters,
  readMinutes,
  testamentLabel,
  category,
  order,
  mutedColor,
}: BookMetaRowProps) {
  const readLabel =
    readMinutes >= 60
      ? `${Math.round(readMinutes / 60)}h read`
      : `${readMinutes}m read`;

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
      }}
    >
      <EmojiMetaThemed
        emoji="📖"
        label={`${chapters} ${chapters === 1 ? "chapter" : "chapters"}`}
        mutedColor={mutedColor}
      />
      <EmojiMetaThemed emoji="🕐" label={readLabel} mutedColor={mutedColor} />
      <EmojiMetaThemed
        emoji="📜"
        label={testamentLabel}
        mutedColor={mutedColor}
      />
      <EmojiMetaThemed emoji="📂" label={category} mutedColor={mutedColor} />
      <EmojiMetaThemed emoji="🔢" label={`#${order}`} mutedColor={mutedColor} />
    </View>
  );
}
