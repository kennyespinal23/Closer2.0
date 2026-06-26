import { Text, View } from "react-native";

/** Inline emoji + label — matches the home hero metadata row. */
export function EmojiMeta({ emoji, label }: { emoji: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={{ fontSize: 14, lineHeight: 18 }} allowFontScaling={false}>
        {emoji}
      </Text>
      <Text
        style={{
          fontFamily: "System",
          fontWeight: "500",
          fontSize: 13,
          lineHeight: 18,
          color: "rgba(255,255,255,0.72)",
          marginLeft: 5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

/** Dark-surface variant for book preview on light/dark theme backgrounds. */
export function EmojiMetaThemed({
  emoji,
  label,
  mutedColor,
}: {
  emoji: string;
  label: string;
  mutedColor: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={{ fontSize: 14, lineHeight: 18 }} allowFontScaling={false}>
        {emoji}
      </Text>
      <Text
        style={{
          fontFamily: "System",
          fontWeight: "500",
          fontSize: 13,
          lineHeight: 18,
          color: mutedColor,
          marginLeft: 5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
