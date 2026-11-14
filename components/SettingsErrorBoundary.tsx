import { Pressable, Share, Text, View } from "react-native";
import type { ErrorBoundaryProps } from "expo-router";

/** Keep a recoverable settings render error out of the fatal native handler. */
export function SettingsErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 28, backgroundColor: "#211C17", gap: 20 }}>
      <Text style={{ color: "#FFF8EE", fontSize: 24, fontWeight: "600" }}>Unable to open settings</Text>
      <Text style={{ color: "#D4C7BB", fontSize: 17, lineHeight: 25 }}>Please try again. If this keeps happening, share the error report with us.</Text>
      <Pressable accessibilityRole="button" onPress={retry} style={{ padding: 18, borderRadius: 28, backgroundColor: "#FFF8EE", alignItems: "center" }}>
        <Text style={{ color: "#211C17", fontSize: 17, fontWeight: "600" }}>Try again</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => {
        void Share.share({ message: `Closer settings error\n${error.message}\n${error.stack ?? ""}` }).catch(() => {});
      }} style={{ padding: 16, alignItems: "center" }}>
        <Text style={{ color: "#FFF8EE", fontSize: 17 }}>Share error report</Text>
      </Pressable>
    </View>
  );
}
