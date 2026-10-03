import { Pressable, View } from "react-native";
import { Text } from "@/components/CloserText";
import { useColors } from "@/state/theme";
import { sheetText } from "@/lib/sheetStyles";

/** Prominent sheet title with one trailing completion action.
 * Compact editing sheets continue to use SheetModalHeader.
 */
export function SheetHeading({ title, onDone, ink, background, actionLabel = "Done" }: {
  title: string; onDone: () => void; ink?: string; background?: string; actionLabel?: string;
}) {
  const colors = useColors();
  const foreground = ink ?? colors.ink;
  return <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
    <Text accessibilityRole="header" style={[sheetText.title, { color: foreground, flex: 1 }]}>{title}</Text>
    <Pressable accessibilityRole="button" onPress={onDone}>
      <View style={{ minHeight: 44, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, borderCurve: "continuous", backgroundColor: foreground, justifyContent: "center" }}>
        <Text style={[sheetText.action, { color: background ?? colors.bg }]}>{actionLabel}</Text>
      </View>
    </Pressable>
  </View>;
}
