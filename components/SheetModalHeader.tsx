import { useState } from "react";
import { ReaderNativeButton } from "@/components/ReaderNativeButton";
import { Pressable, Text, View } from "react-native";
import { systemText } from "@/lib/typography";
import { useColors } from "@/state/theme";

/** Balanced Cancel / title / Save row — equal side columns keep
 *  controls inside the sheet and the title centered. */
const SIDE_WIDTH = 72;

export type SheetModalHeaderProps = {
  nativeControls?: boolean;
  title: string;
  onCancel: () => void;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  cancelLabel?: string;
  /** Hide Save when the sheet is view-only. */
  showSave?: boolean;
};

export function SheetModalHeader({
  nativeControls = false,
  title,
  onCancel,
  onSave,
  saveLabel = "Save",
  saveDisabled = false,
  cancelLabel = "Cancel",
  showSave = true,
}: SheetModalHeaderProps) {
  const colors = useColors();
  const [pressedAction, setPressedAction] = useState<"cancel" | "save" | null>(null);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 16,
        minHeight: 44,
      }}
    >
      <View style={{ width: nativeControls ? 88 : SIDE_WIDTH, alignItems: "flex-start" }}>
        {nativeControls ? <ReaderNativeButton label={cancelLabel} onPress={onCancel} /> : <Pressable
          onPress={onCancel}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          onPressIn={() => setPressedAction("cancel")}
          onPressOut={() => setPressedAction(null)}
          style={{ minWidth: 44, minHeight: 44, justifyContent: "center", opacity: pressedAction === "cancel" ? 0.6 : 1 }}
        >
          <Text style={[systemText.body, { color: colors.inkMuted }]}>
            {cancelLabel}
          </Text>
        </Pressable>}
      </View>

      <View style={{ flex: 1, minWidth: 0, alignItems: "center", paddingHorizontal: 8 }}>
        <Text
          numberOfLines={1}
          style={[
            systemText.headline,
            {
              fontWeight: "700",
              color: colors.ink,
              textAlign: "center",
            },
          ]}
          accessibilityRole="header"
        >
          {title}
        </Text>
      </View>

      <View style={{ width: nativeControls ? 88 : SIDE_WIDTH, alignItems: "flex-end" }}>
        {showSave && onSave ? (nativeControls ? <ReaderNativeButton label={saveLabel} onPress={onSave} disabled={saveDisabled} /> : (
          <Pressable
            onPress={onSave}
            disabled={saveDisabled}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={saveLabel}
            onPressIn={() => setPressedAction("save")}
            onPressOut={() => setPressedAction(null)}
            accessibilityState={{ disabled: saveDisabled }}
            style={{ minWidth: 44, minHeight: 44, justifyContent: "center", opacity: pressedAction === "save" || saveDisabled ? 0.4 : 1 }}
          >
            <Text
              style={[
                systemText.body,
                {
                  fontWeight: "600",
                  color: saveDisabled ? colors.inkSubtle : "#007AFF",
                },
              ]}
            >
              {saveLabel}
            </Text>
          </Pressable>
        )) : (
          <HeaderSpacer />
        )}
      </View>
    </View>
  );
}

function HeaderSpacer() {
  return <View style={{ width: 1, height: 1 }} />;
}
