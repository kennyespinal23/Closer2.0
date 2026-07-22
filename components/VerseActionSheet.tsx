import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as haptics from "@/lib/haptics";
import { AppleSheet } from "@/components/AppleSheet";
import { SFSymbol } from "@/components/Symbol";
import {
  HIGHLIGHT_COLORS,
  type HighlightColorId,
  type NoteEntry,
} from "@/state/annotations";
import { useColors } from "@/state/theme";

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
 * Presentation: AppleSheet — real UIKit sheet so the
 * pull-to-resize, magnetic detent snapping, and grabber pulse all
 * come from `UISheetPresentationController` itself rather than
 * the hand-rolled translateY+spring animation this used to ship
 * with. The two detents below ('auto' = sized to current notes
 * count, 1 = full screen) let a verse with many notes scroll
 * inside the bigger detent without losing the compact default.
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
  const colors = useColors();
  const hasNotes = notes.length > 0;

  return (
    <AppleSheet
      visible={visible}
      onClose={onClose}
      // 'auto' is the default opening size — sized to the current
      // content height (verse + swatches + notes + actions). The
      // optional second detent (full height) lets a verse with
      // many notes drag up for a long-list reading position.
      detents={["auto", 1]}
      backgroundColor={colors.surface}
    >
      <View>
        {/* Reference + preview */}
        <View className="px-6 pt-5 pb-4">
              <Text
                className="text-primary text-[11px] tracking-[1px] uppercase"
                style={{ fontFamily: "System", fontWeight: "700" }}
              >
                {reference ?? ""}
              </Text>
              {previewText && (
                <Text
                  numberOfLines={2}
                  className="text-ink text-[15px] mt-2 leading-[20px]"
                  style={{ fontFamily: "System", fontWeight: "400" }}
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
                  className="text-ink-muted text-[11px] tracking-[1px] uppercase mb-3"
                  style={{ fontFamily: "System", fontWeight: "700" }}
                >
                  Highlight
                </Text>
                <View className="flex-row items-center">
                  {HIGHLIGHT_COLORS.map((c) => {
                    const selected = currentHighlight === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => {
                          // Selection feedback — same haptic the iOS
                          // Notes/Mail picker uses when you cycle
                          // through colors. Reads as a discrete
                          // "value cross" event, distinct from the
                          // weightier confirmation haptics on CTAs.
                          haptics.tick();
                          onHighlight(selected ? null : c.id);
                        }}
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
                    onPress={() => {
                      // Tick — selection feedback. Distinct from
                      // the swatch picks above because semantically
                      // the user just selected "no color", which
                      // is itself a selection value.
                      haptics.tick();
                      onHighlight(null);
                    }}
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
                      className="text-ink-muted text-[11px] tracking-[1px] uppercase mb-3"
                      style={{ fontFamily: "System", fontWeight: "700" }}
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
                              className="text-ink text-[13px] flex-1 leading-[19px]"
                              style={{
                                fontFamily: "System",
                                fontWeight: "500",
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
      </View>
    </AppleSheet>
  );
}

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
        style={{ fontFamily: "System", fontWeight: "600" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Each glyph below is now an SF Symbol — we keep the named
// wrapper functions so the JSX call sites stay identical, but
// the body is a single Symbol render. Apple-native rendering
// at every device scale, no path tuning, and the symbols
// auto-vary their stroke to match the requested weight (e.g.
// "semibold" reads as a slightly chunkier line).

function CheckGlyph({ dark }: { dark?: boolean }) {
  const { ink } = useColors();
  return (
    <SFSymbol
      name="checkmark"
      size={16}
      color={dark ? "#0E0E10" : ink}
      weight="bold"
    />
  );
}

function ClearGlyph() {
  const { inkSubtle } = useColors();
  return (
    <SFSymbol name="xmark" size={14} color={inkSubtle} weight="semibold" />
  );
}

function PlusIcon() {
  const { ink } = useColors();
  return <SFSymbol name="plus" size={16} color={ink} weight="semibold" />;
}

function ShareIcon() {
  const { ink } = useColors();
  return (
    <SFSymbol
      name="square.and.arrow.up"
      size={16}
      color={ink}
      weight="medium"
    />
  );
}

function ChevronRight() {
  const { inkSubtle } = useColors();
  return (
    <SFSymbol
      name="chevron.right"
      size={12}
      color={inkSubtle}
      weight="semibold"
    />
  );
}
