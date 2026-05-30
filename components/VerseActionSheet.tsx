import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import {
  HIGHLIGHT_COLORS,
  type HighlightColorId,
  type NoteEntry,
} from "@/state/annotations";
import { colors } from "@/constants/theme";

/**
 * Bottom action sheet shown when the user taps a verse.
 *
 *   ┌────────────────────────────────────┐
 *   │  John 3:16                         │   ← reference + grab handle
 *   │  "For God so loved the world…"     │   ← short preview
 *   │  ─────────────────────────────     │
 *   │   ●  ●  ●  ●  ●  ⊘                 │   ← color swatches + clear
 *   │  ─────────────────────────────     │
 *   │   Notes (2)                        │
 *   │   ┌──────────────────────────┐     │
 *   │   │ This is the heart of...  │     │   ← existing notes (tap to edit)
 *   │   ├──────────────────────────┤     │
 *   │   │ Compare with Rom 5:8...  │     │
 *   │   └──────────────────────────┘     │
 *   │  ─────────────────────────────     │
 *   │   + Add note         ↗ Share       │   ← actions
 *   └────────────────────────────────────┘
 *
 * Animation: backdrop fades in, panel slides up. Same pattern as the
 * profile drawer so the feel is consistent across the app.
 */
export function VerseActionSheet({
  visible,
  reference,
  previewText,
  currentHighlight,
  notes,
  onHighlight,
  onAddNote,
  onEditNote,
  onShare,
  onClose,
}: {
  visible: boolean;
  /** Display like "John 3:16". Falsy when nothing's selected. */
  reference: string | null;
  /** First line or so of the verse text. */
  previewText: string | null;
  /** Currently-applied highlight, or null if the verse isn't highlighted. */
  currentHighlight: HighlightColorId | null;
  /** All existing notes on this verse, oldest first. */
  notes: ReadonlyArray<NoteEntry>;
  onHighlight: (color: HighlightColorId | null) => void;
  /** Start composing a brand-new note. */
  onAddNote: () => void;
  /** Open the editor on an existing note by id. */
  onEditNote: (noteId: string) => void;
  onShare: () => void;
  onClose: () => void;
}) {
  const translateY = useRef(new Animated.Value(500)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  // Show/hide animation. We animate IN whenever visible becomes
  // true; closing is driven from the parent via the `close` callback
  // because we also need to reset selection state at the same time.
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 14,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset position for next open. Quick reset, no animation
      // because the Modal itself is unmounting.
      translateY.setValue(500);
      backdrop.setValue(0);
    }
  }, [visible, translateY, backdrop]);

  const handleBackdrop = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 500,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const hasNotes = notes.length > 0;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleBackdrop}
      animationType="none"
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop — tap to dismiss. */}
        <Animated.View
          pointerEvents={visible ? "auto" : "none"}
          style={{
            ...StyleSheetAbsoluteFill,
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            opacity: backdrop,
          }}
        >
          <Pressable
            onPress={handleBackdrop}
            style={{ flex: 1 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
        </Animated.View>

        {/* Sheet — anchored to bottom, slides up. */}
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{ translateY }],
            // Cap the sheet height so a verse with many notes scrolls
            // internally instead of overflowing past the top of the
            // screen. ~78% leaves the reference visible behind it.
            maxHeight: "78%",
          }}
        >
          <SafeAreaView
            edges={["bottom"]}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* Grab handle */}
            <View className="items-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-border-strong" />
            </View>

            {/* Reference + preview */}
            <View className="px-6 pt-3 pb-4">
              <Text
                className="text-primary text-[11px] tracking-[2.5px] uppercase"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                {reference ?? ""}
              </Text>
              {previewText && (
                <Text
                  numberOfLines={2}
                  className="text-ink text-[14.5px] mt-2 leading-[20px]"
                  style={{ fontFamily: "PlusJakartaSans_400Regular" }}
                >
                  &ldquo;{previewText}&rdquo;
                </Text>
              )}
            </View>

            {/* Scrollable middle section — color swatches + notes list.
                Wrapping these in a ScrollView lets a verse with many
                notes grow inside the sheet's height cap without losing
                access to the action buttons below. */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              <View className="h-[1px] bg-border mx-6" />

              {/* Color swatches */}
              <View className="px-6 pt-5 pb-2">
                <Text
                  className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase mb-3"
                  style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                >
                  Highlight
                </Text>
                <View className="flex-row items-center">
                  {HIGHLIGHT_COLORS.map((c) => {
                    const selected = currentHighlight === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() =>
                          onHighlight(selected ? null : c.id)
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`${c.name} highlight`}
                        hitSlop={6}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.6 : 1,
                          marginRight: 14,
                        })}
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: c.swatch,
                            borderWidth: selected ? 2.5 : 0,
                            borderColor: colors.ink,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {selected && <CheckGlyph dark />}
                        </View>
                      </Pressable>
                    );
                  })}

                  {/* Clear / no-highlight swatch */}
                  <Pressable
                    onPress={() => onHighlight(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Clear highlight"
                    hitSlop={6}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        borderWidth: 1.5,
                        borderColor: colors.borderStrong,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ClearGlyph />
                    </View>
                  </Pressable>
                </View>
              </View>

              {/* Existing notes — only rendered when the verse already
                  has at least one. Each row is tappable and opens the
                  editor on that specific note. */}
              {hasNotes && (
                <>
                  <View className="h-[1px] bg-border mx-6 mt-5" />
                  <View className="px-6 pt-5">
                    <Text
                      className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase mb-3"
                      style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                    >
                      Notes · {notes.length}
                    </Text>
                    <View className="rounded-2xl border border-border bg-bg overflow-hidden">
                      {notes.map((n, i) => (
                        <View key={n.id}>
                          <Pressable
                            onPress={() => onEditNote(n.id)}
                            style={({ pressed }) => ({
                              opacity: pressed ? 0.85 : 1,
                            })}
                            className="px-4 py-3.5 flex-row items-start"
                          >
                            <View className="w-2 h-2 rounded-full bg-primary mt-2 mr-3" />
                            <Text
                              className="text-ink text-[13.5px] flex-1 leading-[19px]"
                              style={{
                                fontFamily: "PlusJakartaSans_500Medium",
                              }}
                              numberOfLines={3}
                            >
                              {n.text}
                            </Text>
                            <View className="ml-2 mt-0.5">
                              <ChevronRight />
                            </View>
                          </Pressable>
                          {i < notes.length - 1 && (
                            <View className="h-[1px] bg-border ml-4" />
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <View className="h-[1px] bg-border mx-6 mt-5" />

            {/* Actions — Add note always present (label changes when
                there are already notes so it reads as a deliberate
                "another" rather than a duplicate). */}
            <View className="px-6 pt-5 pb-4 flex-row">
              <ActionButton
                icon={<PlusIcon />}
                label={hasNotes ? "Add another note" : "Add note"}
                onPress={onAddNote}
              />
              <View style={{ width: 10 }} />
              <ActionButton
                icon={<ShareIcon />}
                label="Share"
                onPress={onShare}
              />
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const StyleSheetAbsoluteFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

// ─────────────────────────────────────────────────────────────────
// Bits
// ─────────────────────────────────────────────────────────────────

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        opacity: pressed ? 0.8 : 1,
      })}
      className="flex-row items-center justify-center bg-accent-soft border border-border rounded-2xl px-4 py-3.5"
    >
      {icon}
      <Text
        className="text-ink text-[14px] ml-2"
        style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CheckGlyph({ dark }: { dark?: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12l5 5L20 7"
        stroke={dark ? "#0E0E10" : colors.ink}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClearGlyph() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6l12 12M18 6l-12 12"
        stroke={colors.inkSubtle}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PlusIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={colors.ink}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ShareIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4v12M12 4l-4 4M12 4l4 4M5 13v6h14v-6"
        stroke={colors.ink}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={colors.inkSubtle}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
