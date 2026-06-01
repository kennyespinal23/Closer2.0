import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useColors } from "@/state/theme";

/**
 * Full-screen modal for editing a note attached to a single verse.
 *
 * Why a full screen instead of an inline sheet:
 *   • Real estate for typing — notes can be long
 *   • Predictable keyboard behavior via KeyboardAvoidingView
 *   • Lets the user see the verse they're commenting on at the top
 *
 * Returns text on save; the parent persists into AnnotationsProvider.
 * Delete returns an explicit null so empty-after-edit reads the same
 * as "I want this gone".
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
  /** e.g. "John 3:16" */
  reference: string;
  /** Full verse text — shown so the user sees their context. */
  verseText: string;
  /** Existing note text, if any. */
  initialNote: string;
  onSave: (text: string) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const colors = useColors();
  const [text, setText] = useState(initialNote);
  const inputRef = useRef<TextInput>(null);
  const hasInitial = initialNote.trim().length > 0;

  // Reset draft when the modal is re-opened for a new verse.
  useEffect(() => {
    if (visible) {
      setText(initialNote);
      // Slight delay so the input is mounted + the modal animation
      // has settled before the keyboard pops up.
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [visible, initialNote]);

  const dirty = text.trim() !== initialNote.trim();
  const canSave = text.trim().length > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView
        edges={["top", "bottom"]}
        style={{ flex: 1, backgroundColor: colors.bg }}
      >
        {/* Header — Cancel / title / Save */}
        <View className="flex-row items-center px-4 pt-2 pb-3 border-b border-border">
          <Pressable
            onPress={onCancel}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            className="px-2 py-1"
          >
            <Text
              className="text-ink-muted text-[15px]"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            >
              Cancel
            </Text>
          </Pressable>
          <Text
            className="text-ink text-[16px] flex-1 text-center"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            numberOfLines={1}
          >
            {hasInitial ? "Edit Note" : "Add Note"}
          </Text>
          <Pressable
            onPress={() => canSave && onSave(text)}
            hitSlop={12}
            disabled={!canSave || !dirty}
            accessibilityRole="button"
            accessibilityLabel="Save"
            className="px-2 py-1"
          >
            <Text
              className="text-[15px]"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color:
                  canSave && dirty ? colors.primary : colors.inkSubtle,
              }}
            >
              Save
            </Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          {/* Verse card — reminds you what you're noting on */}
          <View className="mx-5 mt-5 mb-4 rounded-2xl border border-border bg-surface px-5 py-4">
            <Text
              className="text-primary text-[10.5px] tracking-[2.5px] uppercase mb-2"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              {reference}
            </Text>
            <Text
              className="text-ink text-[13.5px] leading-[20px]"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
              numberOfLines={4}
            >
              &ldquo;{verseText}&rdquo;
            </Text>
          </View>

          {/* Note input — fills the rest of the screen so long notes
              have room to breathe. */}
          <View className="flex-1 mx-5 mb-3">
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
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 16,
                lineHeight: 24,
                paddingTop: 8,
              }}
            />
          </View>

          {/* Delete — only when there's an existing note to remove. */}
          {hasInitial && (
            <View className="px-5 pb-4">
              <Pressable
                onPress={onDelete}
                accessibilityRole="button"
                accessibilityLabel="Delete note"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                className="flex-row items-center justify-center py-3 rounded-2xl border border-border bg-surface"
              >
                <TrashIcon />
                <Text
                  className="text-[14px] ml-2"
                  style={{
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    color: "#FF6B6B",
                  }}
                >
                  Delete note
                </Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function TrashIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M9 7V5h6v2M10 11v6M14 11v6M6 7l1 13h10l1-13"
        stroke="#FF6B6B"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
