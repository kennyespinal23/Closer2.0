import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppleSheet } from "@/components/AppleSheet";
import { BrandGlyph } from "@/components/BrandGlyph";
import { SFSymbol } from "@/components/Symbol";
import { SOCIAL_APPS, type SocialAppId } from "@/lib/focus";
import { CLOSER_ACCENT } from "@/constants/theme";
import { useColors } from "@/state/theme";

/**
 * BlockedAppsEditor — bottom-sheet picker for the GLOBAL list of
 * apps that get silenced during every time block.
 *
 * App Blocks now treats the apps list as one global commitment
 * ("which apps should I quiet?") and the time list as a separate
 * commitment ("when should they be quieted?"). This editor owns
 * the apps half of that pair.
 *
 * The editor never mutates persisted state directly. It holds a
 * working draft and hands the final list off via `onSubmit`,
 * leaving the choice of "write to focus prefs" / "mirror into
 * every study session" up to the parent. That keeps the editor
 * reusable and the parent's data-shape decisions explicit.
 *
 * Layout mirrors the user's reference Screen Time picker — a
 * rounded full-bleed card of app rows, each with a leading brand
 * glyph and a trailing iOS-blue checkmark accessory when selected.
 * The brand glyphs stay vivid in BOTH states (Apple Screen Time
 * pattern: selection lives in the accessory column, not on the
 * brand color itself).
 */

export type BlockedAppsEditorProps = {
  visible: boolean;
  /** Currently-blocked app ids. Used to seed the draft on open. */
  initial: ReadonlyArray<SocialAppId>;
  onClose: () => void;
  onSubmit: (next: SocialAppId[]) => void | Promise<void>;
};

const PRIMARY_ACCENT = CLOSER_ACCENT;

export function BlockedAppsEditor({
  visible,
  initial,
  onClose,
  onSubmit,
}: BlockedAppsEditorProps) {
  const colors = useColors();

  const seed = useCallback((): SocialAppId[] => [...initial], [initial]);
  const [draft, setDraft] = useState<SocialAppId[]>(seed);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDraft(seed());
    setSubmitting(false);
  }, [visible, seed]);

  const toggleApp = (id: SocialAppId) => {
    setDraft((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  };

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(draft);
    } finally {
      // Parent closes the sheet on submit; the visibility effect
      // resets submitting on the next open.
    }
  };

  return (
    <AppleSheet
      visible={visible}
      onClose={onClose}
      // The app grid is the same length every time (12 social
      // apps), so 'auto' yields a consistent tall sheet without
      // any drag. We keep `1` (full) as an optional second
      // detent for tiny devices where 'auto' might bump the
      // safe-area cap.
      detents={["auto", 1]}
      backgroundColor={colors.bg}
      scrollable
    >
      <View>
            {/* Header — Cancel / title / Save. Same chrome as
                TimeBlockEditor so stacking the two sheets feels
                like one coherent modal vocabulary. */}
            <View className="flex-row items-center px-5 pt-3 pb-3">
              <Pressable
                onPress={onClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Text
                  style={{
                    fontFamily: "System",
                    fontWeight: "500",
                    color: colors.inkMuted,
                    fontSize: 15,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>
              <View className="flex-1 items-center px-3">
                <Text
                  style={{
                    fontFamily: "System",
                    fontWeight: "700",
                    color: colors.ink,
                    fontSize: 17,
                    letterSpacing: -0.3,
                  }}
                  accessibilityRole="header"
                >
                  Blocked Apps
                </Text>
              </View>
              <Pressable
                onPress={handleSave}
                disabled={submitting}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Save blocked apps"
                style={({ pressed }) => ({
                  opacity: pressed || submitting ? 0.4 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: "System",
                    fontWeight: "700",
                    color: PRIMARY_ACCENT,
                    fontSize: 15,
                  }}
                >
                  Save
                </Text>
              </Pressable>
            </View>

            <Text
              style={{
                fontFamily: "System",
                fontWeight: "400",
                color: colors.inkMuted,
                fontSize: 13.5,
                lineHeight: 19,
                paddingHorizontal: 24,
                paddingBottom: 14,
              }}
            >
              Pick the apps you want quieted during every block.
            </Text>

            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 32,
              }}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={{
                  borderRadius: 16,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  overflow: "hidden",
                }}
              >
                {SOCIAL_APPS.map((app, i) => {
                  const selected = draft.includes(app.id);
                  return (
                    <AppRow
                      key={app.id}
                      appId={app.id}
                      name={app.name}
                      selected={selected}
                      showDivider={i < SOCIAL_APPS.length - 1}
                      onPress={() => toggleApp(app.id)}
                    />
                  );
                })}
              </View>
            </ScrollView>
      </View>
    </AppleSheet>
  );
}

function AppRow({
  appId,
  name,
  selected,
  showDivider,
  onPress,
}: {
  appId: SocialAppId;
  name: string;
  selected: boolean;
  showDivider: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Toggle ${name}`}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        backgroundColor: selected
          ? withAlphaHex(PRIMARY_ACCENT, 0.08)
          : "transparent",
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <BrandGlyph appId={appId} size="md" />
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            marginLeft: 14,
            fontFamily: "System",
            fontWeight: "600",
            fontSize: 16,
            letterSpacing: -0.2,
            color: colors.ink,
          }}
        >
          {name}
        </Text>
        {selected ? (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: PRIMARY_ACCENT,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckGlyph stroke="#FFFFFF" />
          </View>
        ) : (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: withAlphaHex(colors.ink, 0.18),
              backgroundColor: "transparent",
            }}
          />
        )}
      </View>
      {showDivider ? (
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: colors.border,
            // Indent the divider to start AFTER the brand glyph
            // (Apple pattern) so the glyph reads as the anchor of
            // its own row rather than the start of a hairline rule.
            marginLeft: 14 + 40 + 14,
          }}
        />
      ) : null}
    </Pressable>
  );
}

function CheckGlyph({ stroke }: { stroke: string }) {
  // `stroke` is preserved as the prop name so call sites stay
  // unchanged; SF Symbol's `tintColor` is the equivalent
  // concept (uniform fill applied to the symbol's path).
  return <SFSymbol name="checkmark" size={12} color={stroke} weight="bold" />;
}

function withAlphaHex(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return hex;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
