import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as haptics from "@/lib/haptics";
import { findMomentByDay, resolveSermonType, splitScripture } from "@/lib/moments";
import { useSavedSermons } from "@/state/savedSermons";
import { useColors } from "@/state/theme";

/**
 * Saved-sermon viewer.
 *
 * Lives OUTSIDE the `app/sermon/` flow on purpose:
 *   • The sermon flow is a one-way ritual (scripture → 4
 *     narrative beats → prayer → celebration), with timers, a
 *     progress bar, and "unlock apps" semantics. Re-reading a
 *     saved sermon shouldn't drag the user through the timer
 *     dwell again or re-trigger the completion ceremony.
 *   • This screen is a calm read-only single-page rendering of
 *     the same content: scripture at the top, then every panel
 *     body concatenated with breathing space between them.
 *
 * URL: `/saved-sermon/[day]` where `day` is the 1..90 catalog
 * day stored in the SavedSermonsProvider. If the day doesn't
 * resolve to a real moment (manual deep-link with garbage,
 * vault truncation after a content cull), the screen falls
 * back to a gentle "not found" view with a Back chevron
 * rather than crashing.
 *
 * No timers, no progress bar, no completion side effects —
 * just the words. An "Unsave" tap in the header removes the
 * day from the saved set and bounces the user back to the
 * Library tab so the toggle is reachable without rummaging
 * through nested settings.
 */
export default function SavedSermonViewer() {
  const router = useRouter();
  const colors = useColors();
  const { day: dayParam } = useLocalSearchParams<{ day: string }>();
  const day = Number(dayParam);
  const moment = Number.isFinite(day) ? findMomentByDay(day) : null;
  const type = useMemo(
    () => (moment ? resolveSermonType(moment.type) : null),
    [moment],
  );
  const scripture = useMemo(
    () => (moment ? splitScripture(moment.scripture) : null),
    [moment],
  );
  const { isSaved, unsave } = useSavedSermons();
  const saved = moment ? isSaved(moment.day) : false;

  const handleClose = () => {
    haptics.soft();
    router.back();
  };

  const handleUnsave = () => {
    if (!moment) return;
    haptics.soft();
    unsave(moment.day);
    router.back();
  };

  if (!moment || !type) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }}>
        <Header colors={colors} title="Saved" onClose={handleClose} />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.ink,
              fontSize: 17,
              textAlign: "center",
            }}
          >
            This sermon isn't in the current catalog.
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_500Medium",
              color: colors.inkMuted,
              fontSize: 13,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            It may have been removed in a content update.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }}>
      <Header
        colors={colors}
        title="Saved"
        onClose={handleClose}
        trailing={
          <BookmarkAction
            saved={saved}
            accent={type.accent}
            mutedColor={colors.inkMuted}
            onPress={handleUnsave}
          />
        }
      />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 64,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Type eyebrow — small tracked accent label that names
            the sermon's color world without forcing the user
            to know the per-day catalog. */}
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: type.accent,
            fontSize: 11,
            letterSpacing: 2.5,
            textTransform: "uppercase",
          }}
        >
          {type.name}
        </Text>

        {/* Sermon title */}
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: "#FFFFFF",
            fontSize: 28,
            lineHeight: 34,
            letterSpacing: -0.5,
            marginTop: 10,
          }}
        >
          {moment.title}
        </Text>

        {/* Voice attribution */}
        {moment.voice ? (
          <Text
            style={{
              fontFamily: "PlusJakartaSans_500Medium",
              color: colors.inkMuted,
              fontSize: 14,
              marginTop: 6,
            }}
          >
            {moment.voice}
          </Text>
        ) : null}

        {/* Scripture block — quoted, with the reference below.
            Keeps the verse the visual anchor of the page,
            same way it was the opening beat of the sermon flow. */}
        {scripture && scripture.text ? (
          <View
            style={{
              marginTop: 28,
              padding: 18,
              borderRadius: 16,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderLeftWidth: 3,
              borderLeftColor: type.accent,
            }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_500Medium",
                color: "#FFFFFF",
                fontSize: 17,
                lineHeight: 26,
                letterSpacing: -0.2,
                fontStyle: "italic",
              }}
            >
              {scripture.text}
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: type.accent,
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginTop: 12,
              }}
            >
              {scripture.reference}
            </Text>
          </View>
        ) : null}

        {/* Sermon body — all five panels concatenated. Panels
            already carry their own internal paragraph
            structure (blank-line splits handled inline);
            stacking them with a 28pt gap reads as one
            continuous read instead of a five-tap flow. */}
        <View style={{ marginTop: 32 }}>
          {moment.panels.map((panel, panelIdx) => {
            const paragraphs = panel.body
              .split(/\n{2,}/)
              .map((s) => s.trim())
              .filter(Boolean);
            return (
              <View
                key={panel.id}
                style={{
                  marginBottom:
                    panelIdx === moment.panels.length - 1 ? 0 : 28,
                }}
              >
                {paragraphs.map((p, i) => (
                  <Text
                    key={i}
                    style={{
                      fontFamily: "PlusJakartaSans_400Regular",
                      color: "#FFFFFF",
                      fontSize: panel.isPrayer ? 19 : 17,
                      lineHeight: panel.isPrayer ? 30 : 28,
                      letterSpacing: -0.1,
                      textAlign: panel.isPrayer ? "center" : "left",
                      marginBottom: 18,
                      fontStyle: panel.isPrayer ? "italic" : "normal",
                    }}
                  >
                    {p}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({
  colors,
  title,
  onClose,
  trailing,
}: {
  colors: { ink: string; border: string; surface: string };
  title: string;
  onClose: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 12,
      }}
    >
      <Pressable
        hitSlop={12}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 6l-6 6 6 6"
              stroke={colors.ink}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </Pressable>

      <Text
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          color: colors.ink,
          fontSize: 15,
          letterSpacing: -0.2,
        }}
      >
        {title}
      </Text>

      <View style={{ width: 36, alignItems: "flex-end" }}>{trailing}</View>
    </View>
  );
}

function BookmarkAction({
  saved,
  accent,
  mutedColor,
  onPress,
}: {
  saved: boolean;
  accent: string;
  mutedColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={saved ? "Remove from saved" : "Save sermon"}
      accessibilityState={{ selected: saved }}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path
          d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"
          stroke={saved ? accent : mutedColor}
          strokeWidth={saved ? 0 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={saved ? accent : "none"}
        />
      </Svg>
    </Pressable>
  );
}
