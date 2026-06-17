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
 * Full-screen modal for writing down how you feel after a check-in.
 *
 * Sibling of NoteEditor — same modal + KeyboardAvoidingView pattern,
 * but tuned to a reflective journaling moment instead of a note on
 * a specific verse:
 *
 *   • Mood echoed at the top in the mood's accent color, not a
 *     verse reference. The verse is shown small underneath so the
 *     user remembers what they're reflecting on without it
 *     dominating the writing space.
 *   • Placeholder copy invites reflection ("What's on your heart
 *     right now?") instead of commentary on text.
 *   • Save is always enabled when the text is non-empty; we also
 *     accept "save empty" as an explicit delete (via the trash row
 *     when there was a previous entry).
 *
 * The component is dumb — it manages a local draft and emits via
 * onSave / onDelete / onCancel. The parent (verse delivery screen)
 * owns the underlying CheckIn record and decides what to do.
 */
export function JournalEditor({
  visible,
  moodLabel,
  moodAccent,
  reference,
  verseText,
  initialText,
  onSave,
  onDelete,
  onCancel,
}: {
  visible: boolean;
  /** Display label of the mood, e.g. "Anxious". */
  moodLabel: string;
  /** Mood swatch — used for the eyebrow + save button highlight. */
  moodAccent: string;
  reference: string;
  verseText: string;
  /** Existing journal text, if any. */
  initialText: string;
  onSave: (text: string) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const colors = useColors();
  const [text, setText] = useState(initialText);
  const inputRef = useRef<TextInput>(null);
  const hasInitial = initialText.trim().length > 0;

  // Reset draft + auto-focus each time the modal opens. The
  // setTimeout gives the slide animation time to settle before the
  // keyboard pops up — without it the keyboard often opens before
  // the modal is fully painted, which looks jumpy.
  useEffect(() => {
    if (visible) {
      setText(initialText);
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [visible, initialText]);

  const dirty = text.trim() !== initialText.trim();
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
            {hasInitial ? "Edit Journal" : "Journal"}
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
                color: canSave && dirty ? moodAccent : colors.inkSubtle,
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
          {/* Context card — small mood + verse reminder. Quieter
              than NoteEditor's verse card because the writing IS
              the focus here, not the verse. */}
          <View
            className="mx-5 mt-5 mb-4 rounded-2xl border bg-surface px-5 py-4"
            style={{ borderColor: hexAlpha(moodAccent, 0.28) }}
          >
            <Text
              className="text-[11px] tracking-[2.5px] uppercase mb-2"
              style={{
                fontFamily: "System",
                fontWeight: "700",
                color: moodAccent,
              }}
            >
              Feeling {moodLabel.toLowerCase()} · {reference}
            </Text>
            <Text
              className="text-ink-muted text-[13px] leading-[19px] italic"
              style={{ fontFamily: "System", fontWeight: "400" }}
              numberOfLines={3}
            >
              &ldquo;{verseText}&rdquo;
            </Text>
          </View>

          {/* Journal input — fills the rest of the screen so longer
              entries have room. */}
          <View className="flex-1 mx-5 mb-3">
            <TextInput
              ref={inputRef}
              multiline
              value={text}
              onChangeText={setText}
              placeholder="What's on your heart right now?"
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

          {/* Delete — only when there's an existing entry to remove. */}
          {hasInitial && (
            <View className="px-5 pb-4">
              <Pressable
                onPress={onDelete}
                accessibilityRole="button"
                accessibilityLabel="Delete journal entry"
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
                  Delete journal
                </Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </AppleSheet>
  );
}

// ─────────────────────────────────────────────────────────────────
// Glyphs / helpers
// ─────────────────────────────────────────────────────────────────

function TrashIcon() {
  return <SFSymbol name="trash" size={16} color="#FF6B6B" weight="medium" />;
}

function hexAlpha(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const hh = Math.round(a * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${hh}`;
}
