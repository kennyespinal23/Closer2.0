import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppleSheet } from "@/components/AppleSheet";
import { SFSymbol } from "@/components/Symbol";
import { useColors } from "@/state/theme";

/**
 * Full-screen note editor for a single verse (or multi-verse selection).
 *
 * Uses AppleSheet at the full-screen detent — same pattern as
 * JournalEditor — so the native sheet dims and covers the reader
 * completely instead of the RN Modal occasionally presenting at
 * the wrong width over the horizontal chapter pager.
 */
export function NoteEditor({
  visible,
  reference,
  verseText,
  initialNote,
  onSave,
  onDelete,
  onCancel,
}: {
  visible: boolean;
  reference: string;
  verseText: string;
  initialNote: string;
  onSave: (text: string) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const colors = useColors();
  const [text, setText] = useState(initialNote);
  const inputRef = useRef<TextInput>(null);
  const hasInitial = initialNote.trim().length > 0;

  useEffect(() => {
    if (!visible) return;
    setText(initialNote);
    const t = setTimeout(() => inputRef.current?.focus(), 280);
    return () => clearTimeout(t);
  }, [visible, initialNote]);

  const dirty = text.trim() !== initialNote.trim();
  const canSave = text.trim().length > 0;

  return (
    <AppleSheet
      visible={visible}
      onClose={onCancel}
      detents={[1]}
      grabber={false}
      backgroundColor={colors.bg}
    >
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable
            onPress={onCancel}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            style={{ paddingHorizontal: 8, paddingVertical: 4 }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "500",
                fontSize: 15,
                color: colors.inkMuted,
              }}
            >
              Cancel
            </Text>
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: "System",
              fontWeight: "700",
              fontSize: 16,
              color: colors.ink,
            }}
            numberOfLines={1}
          >
            {hasInitial ? "Edit Note" : "Add Note"}
          </Text>
          <Pressable
            onPress={() => canSave && dirty && onSave(text)}
            hitSlop={12}
            disabled={!canSave || !dirty}
            accessibilityRole="button"
            accessibilityLabel="Save"
            style={{ paddingHorizontal: 8, paddingVertical: 4 }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "700",
                fontSize: 15,
                color: canSave && dirty ? colors.primary : colors.inkSubtle,
              }}
            >
              Save
            </Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 24}
        >
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 20,
              marginBottom: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              paddingHorizontal: 20,
              paddingVertical: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "700",
                fontSize: 11,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                color: colors.primary,
                marginBottom: 8,
              }}
            >
              {reference}
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "400",
                fontSize: 13,
                lineHeight: 20,
                color: colors.ink,
              }}
              numberOfLines={4}
            >
              &ldquo;{verseText}&rdquo;
            </Text>
          </View>

          <View style={{ flex: 1, marginHorizontal: 20, marginBottom: 12 }}>
            <TextInput
              ref={inputRef}
              multiline
              value={text}
              onChangeText={setText}
              placeholder="Write what this verse means to you…"
              placeholderTextColor={colors.inkSubtle}
              textAlignVertical="top"
              style={{
                flex: 1,
                color: colors.ink,
                fontFamily: "System",
                fontWeight: "400",
                fontSize: 16,
                lineHeight: 24,
                paddingTop: 8,
              }}
            />
          </View>

          {hasInitial ? (
            <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
              <Pressable
                onPress={onDelete}
                accessibilityRole="button"
                accessibilityLabel="Delete note"
              >
                {({ pressed }) => (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 12,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      opacity: pressed ? 0.7 : 1,
                    }}
                  >
                    <SFSymbol
                      name="trash"
                      size={16}
                      color="#FF6B6B"
                      weight="medium"
                    />
                    <Text
                      style={{
                        fontFamily: "System",
                        fontWeight: "600",
                        fontSize: 14,
                        color: "#FF6B6B",
                        marginLeft: 8,
                      }}
                    >
                      Delete note
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </View>
    </AppleSheet>
  );
}
