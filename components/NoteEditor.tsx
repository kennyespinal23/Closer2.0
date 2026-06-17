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
    <AppleSheet
      visible={visible}
      onClose={onCancel}
      // Full-height detent only — text editors need every pixel
      // they can get once the keyboard is up. The grabber stays
      // visible so users still have the iOS-standard
      // swipe-to-dismiss path alongside Cancel.
      detents={[1]}
      backgroundColor={colors.bg}
    >
      <View style={{ flex: 1 }}>
        {/* Header — Cancel / title / Save */}
        <View className="flex-row items-center px-4 pt-3 pb-3 border-b border-border">
          <Pressable
            onPress={onCancel}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            className="px-2 py-1"
          >
            <Text
              className="text-ink-muted text-[15px]"
              style={{ fontFamily: "System", fontWeight: "500" }}
            >
              Cancel
            </Text>
          </Pressable>
          <Text
            className="text-ink text-[16px] flex-1 text-center"
            style={{ fontFamily: "System", fontWeight: "700" }}
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
                fontFamily: "System",
                fontWeight: "700",
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
              className="text-primary text-[11px] tracking-[2.5px] uppercase mb-2"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              {reference}
            </Text>
            <Text
              className="text-ink text-[13.5px] leading-[20px]"
              style={{ fontFamily: "System", fontWeight: "400" }}
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
                fontFamily: "System",
                fontWeight: "400",
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
                    fontFamily: "System",
                    fontWeight: "600",
                    color: "#FF6B6B",
                  }}
                >
                  Delete note
                </Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </AppleSheet>
  );
}

function TrashIcon() {
  // SF Symbol "trash" — same visual language as the Mail/Notes
  // delete glyph users see system-wide, so the affordance reads
  // unambiguously even at small sizes.
  return <SFSymbol name="trash" size={16} color="#FF6B6B" weight="medium" />;
}
