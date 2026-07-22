import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { AppleSheet } from "@/components/AppleSheet";
import { SheetModalHeader } from "@/components/SheetModalHeader";
import {
  AVATARS,
  type AvatarId,
  findAvatar,
} from "@/constants/avatars";
import { minTouchTarget, spacing } from "@/constants/spacing";
import * as haptics from "@/lib/haptics";
import { useColors } from "@/state/theme";

const COLS = 3;
const GRID_GAP = spacing[12];
const H_PAD = spacing[16];

export type AvatarPickerSheetProps = {
  visible: boolean;
  /** Currently saved avatar id, or undefined for initials fallback. */
  selectedId: string | undefined;
  onSelect: (id: AvatarId) => void;
  onClear?: () => void;
  onClose: () => void;
};

/**
 * Profile avatar picker — grid of built-in avatars in an AppleSheet.
 * Tap selects immediately (with haptic), then dismisses. Optional
 * "Use initials" clears the saved id so Profile falls back to the
 * monogram.
 */
export function AvatarPickerSheet({
  visible,
  selectedId,
  onSelect,
  onClear,
  onClose,
}: AvatarPickerSheetProps) {
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const [draft, setDraft] = useState<string | undefined>(selectedId);

  useEffect(() => {
    if (visible) setDraft(selectedId);
  }, [visible, selectedId]);

  const cellSize = useMemo(() => {
    const inner = screenWidth - H_PAD * 2 - GRID_GAP * (COLS - 1);
    return Math.floor(inner / COLS);
  }, [screenWidth]);

  const handleConfirm = () => {
    if (draft && findAvatar(draft)) {
      onSelect(draft as AvatarId);
    } else if (!draft && onClear) {
      onClear();
    }
    onClose();
  };

  return (
    <AppleSheet
      visible={visible}
      onClose={onClose}
      detents={["auto", 1]}
    >
      <SheetModalHeader
        title="Choose avatar"
        cancelLabel="Cancel"
        saveLabel="Save"
        onCancel={onClose}
        onSave={handleConfirm}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: H_PAD,
          paddingBottom: spacing[32],
          gap: spacing[16],
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: GRID_GAP,
          }}
        >
          {AVATARS.map((avatar) => {
            const selected = draft === avatar.id;
            return (
              <Pressable
                key={avatar.id}
                onPress={() => {
                  haptics.tick();
                  setDraft(avatar.id);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Avatar ${avatar.id}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: cellSize / 2,
                  overflow: "hidden",
                  borderWidth: selected ? 3 : StyleSheet.hairlineWidth,
                  borderColor: selected ? colors.select : colors.border,
                }}
              >
                <Image
                  source={avatar.source}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </Pressable>
            );
          })}
        </View>

        {onClear ? (
          <Pressable
            onPress={() => {
              haptics.tick();
              setDraft(undefined);
            }}
            accessibilityRole="button"
            accessibilityLabel="Use initials instead of an avatar"
            style={({ pressed }) => ({
              minHeight: minTouchTarget,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              backgroundColor: colors.surfaceSecondary,
              opacity: pressed ? 0.75 : 1,
              borderWidth: draft == null ? 2 : StyleSheet.hairlineWidth,
              borderColor: draft == null ? colors.select : colors.border,
            })}
          >
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "600",
                fontSize: 15,
                color: colors.ink,
              }}
            >
              Use initials
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </AppleSheet>
  );
}
