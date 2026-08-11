import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BubbleBackButton } from "@/components/BubbleBackButton";
import { SFSymbol } from "@/components/Symbol";
import * as haptics from "@/lib/haptics";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { systemText, typography } from "@/lib/typography";
import {
  HIGHLIGHT_COLORS,
  type HighlightColorId,
  findHighlightColor,
} from "@/state/annotations";
import { useColors, useResolvedScheme } from "@/state/theme";

const DEFAULT_COLOR: HighlightColorId = HIGHLIGHT_COLORS[0]!.id;

/**
 * Sticky-note composer — Bible reader add / view note.
 *
 * Existing notes open in read mode (no keyboard). Tap the paper to
 * edit. New notes open ready to write. The card slides up from the
 * bottom of the screen.
 */
export function NoteEditor({
  visible,
  reference,
  verseText,
  initialNote,
  initialColor,
  onSave,
  onDelete,
  onCancel,
}: {
  visible: boolean;
  reference: string;
  verseText: string;
  initialNote: string;
  initialColor?: string | null;
  onSave: (text: string, color: HighlightColorId) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [text, setText] = useState(initialNote);
  const [colorId, setColorId] = useState<HighlightColorId>(
    resolveInitialColor(initialColor),
  );
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const slide = useRef(new Animated.Value(0)).current;
  const hasInitial = initialNote.trim().length > 0;
  const noteSize = Math.min(windowWidth - 56, 320);
  const paper = findHighlightColor(colorId) ?? HIGHLIGHT_COLORS[0]!;

  useEffect(() => {
    if (!visible) {
      slide.setValue(0);
      return;
    }
    setText(initialNote);
    setColorId(resolveInitialColor(initialColor));
    // Existing notes → read first. Brand-new notes → edit immediately.
    const startEditing = !initialNote.trim();
    setEditing(startEditing);

    if (reducedMotion) {
      slide.setValue(1);
    } else {
      // Same entrance as Notes-tab post-its (bottom slide + fade).
      slide.setValue(0);
      Animated.timing(slide, {
        toValue: 1,
        duration: 560,
        delay: 60,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }

    if (startEditing) {
      const t = setTimeout(() => inputRef.current?.focus(), 520);
      return () => clearTimeout(t);
    }
  }, [visible, initialNote, initialColor, reducedMotion, slide]);

  const canSave = text.trim().length > 0;
  // Rise from below the fold — matches collection post-it travel.
  const noteTranslateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.min(220, windowHeight * 0.28), 0],
  });
  const trayTranslateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [140, 0],
  });

  const beginEditing = () => {
    if (editing) return;
    haptics.soft();
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleShare = async () => {
    const body = text.trim();
    const verseBit = verseText.trim()
      ? `“${verseText.trim()}”\n— ${reference}`
      : reference;
    const message = body
      ? `${verseBit}\n\n${body}\n\nvia Closer`
      : `${verseBit}\n\nvia Closer`;
    try {
      await Share.share({ message, title: `${reference} · Closer` });
    } catch {
      // User dismissed — silent.
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        <BlurView
          intensity={48}
          tint={scheme === "dark" ? "dark" : "light"}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor:
              scheme === "dark" ? "rgba(0,0,0,0.45)" : "rgba(253,246,236,0.35)",
          }}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={{
              paddingTop: insets.top + 4,
              paddingHorizontal: 12,
              flexDirection: "row",
              alignItems: "center",
              zIndex: 2,
            }}
          >
            <BubbleBackButton
              onPress={onCancel}
              accessibilityLabel="Close"
            />
            <Text
              style={[
                systemText.footnote,
                {
                  flex: 1,
                  textAlign: "center",
                  color: colors.inkMuted,
                  marginRight: 44,
                },
              ]}
              numberOfLines={1}
            >
              {reference}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 24,
              paddingBottom: 8,
            }}
          >
            <Animated.View
              style={{
                opacity: slide,
                transform: [{ translateY: noteTranslateY }],
              }}
            >
              <Pressable
                onPress={beginEditing}
                disabled={editing}
                accessibilityRole={editing ? undefined : "button"}
                accessibilityLabel={
                  editing ? undefined : "Tap note to edit"
                }
              >
                <View
                  style={{
                    width: noteSize,
                    height: noteSize,
                    borderRadius: 28,
                    borderWidth: 6,
                    borderColor: "#FFFFFF",
                    backgroundColor: "#FFFFFF",
                    overflow: "hidden",
                    ...Platform.select({
                      ios: {
                        shadowColor: "#1A1510",
                        shadowOffset: { width: 0, height: 16 },
                        shadowOpacity: 0.2,
                        shadowRadius: 28,
                      },
                      android: { elevation: 12 },
                    }),
                  }}
                >
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: paper.fill,
                    }}
                  />
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "flex-start",
                      paddingHorizontal: 18,
                      paddingTop: 18,
                      paddingBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: "rgba(26,21,16,0.08)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 10,
                        marginTop: 2,
                      }}
                    >
                      <SFSymbol
                        name={editing ? "pencil" : "note.text"}
                        size={13}
                        color="rgba(26,21,16,0.45)"
                        weight="semibold"
                      />
                    </View>
                    {editing ? (
                      <TextInput
                        ref={inputRef}
                        multiline
                        value={text}
                        onChangeText={setText}
                        placeholder="Add text to this note"
                        placeholderTextColor="rgba(26,21,16,0.35)"
                        textAlignVertical="top"
                        style={{
                          flex: 1,
                          color: "#1A1510",
                          fontFamily: "System",
                          fontWeight: "400",
                          fontSize: 17,
                          lineHeight: 24,
                          paddingTop: 4,
                          minHeight: noteSize - 56,
                        }}
                      />
                    ) : (
                      <Text
                        style={{
                          flex: 1,
                          color: "#1A1510",
                          fontFamily: "System",
                          fontWeight: "400",
                          fontSize: 17,
                          lineHeight: 24,
                          paddingTop: 4,
                        }}
                      >
                        {text.trim() || "Empty note"}
                      </Text>
                    )}
                  </View>
                  {!editing && hasInitial ? (
                    <Text
                      style={[
                        systemText.caption1,
                        {
                          position: "absolute",
                          bottom: 14,
                          left: 18,
                          right: 18,
                          color: "rgba(26,21,16,0.4)",
                          textAlign: "center",
                        },
                      ]}
                    >
                      Tap to edit
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            </Animated.View>
          </View>

          <Animated.View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 20,
              paddingBottom: Math.max(insets.bottom, 16),
              paddingHorizontal: 20,
              opacity: slide,
              transform: [{ translateY: trayTranslateY }],
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -6 },
                  shadowOpacity: 0.08,
                  shadowRadius: 16,
                },
                android: { elevation: 10 },
              }),
            }}
          >
            {editing ? (
              <>
                <Text
                  style={[
                    typography.smallLabel,
                    {
                      color: colors.inkMuted,
                      textTransform: "uppercase",
                      marginBottom: 12,
                    },
                  ]}
                >
                  Note color
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
                >
                  {HIGHLIGHT_COLORS.map((c) => {
                    const selected = colorId === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => {
                          haptics.tick();
                          setColorId(c.id);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${c.name} note color`}
                        hitSlop={6}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: selected ? 2 : 0,
                          borderColor: colors.ink,
                        }}
                      >
                        <View
                          style={{
                            width: selected ? 34 : 38,
                            height: selected ? 34 : 38,
                            borderRadius: 19,
                            backgroundColor: c.swatch,
                          }}
                        />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            ) : (
              <Text
                style={[
                  systemText.subheadline,
                  {
                    color: colors.inkMuted,
                    textAlign: "center",
                    marginBottom: 4,
                  },
                ]}
              >
                Tap the note to edit
              </Text>
            )}

            <View
              style={{
                flexDirection: "row",
                gap: 10,
                marginTop: editing ? 22 : 16,
              }}
            >
              <TrayAction
                icon="square.and.arrow.up"
                label="Share"
                onPress={() => {
                  haptics.soft();
                  void handleShare();
                }}
                muted={colors.inkMuted}
                ink={colors.ink}
                surface={colors.surfaceSecondary}
              />
              {hasInitial ? (
                <TrayAction
                  icon="trash"
                  label="Delete"
                  onPress={() => {
                    haptics.soft();
                    onDelete();
                  }}
                  muted={colors.destructive}
                  ink={colors.destructive}
                  surface={colors.surfaceSecondary}
                />
              ) : null}
              {editing ? (
                <TrayAction
                  icon="checkmark.circle"
                  label="Save"
                  onPress={() => {
                    if (!canSave) return;
                    haptics.soft();
                    onSave(text, colorId);
                  }}
                  muted={canSave ? colors.inkMuted : colors.inkSubtle}
                  ink={canSave ? colors.ink : colors.inkSubtle}
                  surface={colors.surfaceSecondary}
                  disabled={!canSave}
                  flex
                />
              ) : (
                <TrayAction
                  icon="pencil"
                  label="Edit"
                  onPress={beginEditing}
                  muted={colors.inkMuted}
                  ink={colors.ink}
                  surface={colors.surfaceSecondary}
                  flex
                />
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function resolveInitialColor(raw: string | null | undefined): HighlightColorId {
  if (!raw) return DEFAULT_COLOR;
  if (findHighlightColor(raw as HighlightColorId)) {
    return raw as HighlightColorId;
  }
  return DEFAULT_COLOR;
}

function TrayAction({
  icon,
  label,
  onPress,
  muted,
  ink,
  surface,
  disabled,
  flex,
}: {
  icon: "square.and.arrow.up" | "trash" | "checkmark.circle" | "pencil";
  label: string;
  onPress: () => void;
  muted: string;
  ink: string;
  surface: string;
  disabled?: boolean;
  flex?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ flex: flex ? 1.4 : 1, opacity: disabled ? 0.45 : 1 }}
    >
      {({ pressed }) => (
        <View
          style={{
            minHeight: 72,
            borderRadius: 18,
            backgroundColor: surface,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 12,
            paddingHorizontal: 8,
            opacity: pressed ? 0.85 : 1,
          }}
        >
          <SFSymbol name={icon} size={20} color={muted} weight="medium" />
          <Text
            style={[
              systemText.caption1,
              {
                color: ink,
                marginTop: 6,
                fontWeight: "600",
                textAlign: "center",
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
