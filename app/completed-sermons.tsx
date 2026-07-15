import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as haptics from "@/lib/haptics";
import { SFSymbol } from "@/components/Symbol";
import { type ColorPalette } from "@/constants/theme";
import { relativeTime } from "@/lib/annotationsFormat";
import { typography } from "@/lib/typography";
import { findMomentByDay, resolveSermonType } from "@/lib/moments";
import { type SermonCompletion, useProgress } from "@/state/progress";
import { useColors } from "@/state/theme";

/**
 * Completed sermons — every catalog day the user has finished,
 * newest first. Reached from the home screen's top-left book
 * affordance.
 */
export default function CompletedSermonsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { sermonCompletions } = useProgress();

  const completed = useMemo(
    () => dedupeCompletionsByDay(sermonCompletions),
    [sermonCompletions],
  );

  const subtitle =
    completed.length === 0
      ? "Finished devotionals collect here for easy re-reading."
      : completed.length === 1
        ? "1 devotional finished · tap to read again"
        : `${completed.length} devotionals finished · tap to read again`;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top", "bottom"]}
    >
      <NavBar colors={colors} onBack={() => router.back()} />

      {completed.length === 0 ? (
        <EmptyState colors={colors} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[typography.pageTitle, { color: colors.ink }]}>
            Completed
          </Text>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "500",
              fontSize: 15,
              lineHeight: 22,
              color: colors.inkMuted,
              marginTop: 8,
              marginBottom: 24,
            }}
          >
            {subtitle}
          </Text>

          <View
            style={{
              borderRadius: 16,
              backgroundColor: colors.surfaceSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: "hidden",
            }}
          >
            {completed.map((entry, index) => (
              <CompletedSermonRow
                key={entry.id}
                entry={entry}
                colors={colors}
                isLast={index === completed.length - 1}
                onPress={() => {
                  if (entry.day == null) return;
                  haptics.soft();
                  router.push(`/saved-sermon/${entry.day}`);
                }}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function dedupeCompletionsByDay(
  completions: ReadonlyArray<SermonCompletion>,
): SermonCompletion[] {
  const byDay = new Map<number, SermonCompletion>();
  for (const entry of [...completions].sort(
    (a, b) => b.completedAt - a.completedAt,
  )) {
    if (entry.day == null || byDay.has(entry.day)) continue;
    byDay.set(entry.day, entry);
  }
  return [...byDay.values()].sort((a, b) => b.completedAt - a.completedAt);
}

function CompletedSermonRow({
  entry,
  colors,
  isLast,
  onPress,
}: {
  entry: SermonCompletion;
  colors: ColorPalette;
  isLast: boolean;
  onPress: () => void;
}) {
  const moment = entry.day != null ? findMomentByDay(entry.day) : null;
  const type = moment ? resolveSermonType() : null;
  const accent = type?.accent ?? colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={entry.day == null}
      accessibilityRole="button"
      accessibilityLabel={`Read again: ${entry.title}`}
    >
      {({ pressed }) => (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: isLast ? 0 : 1,
            borderBottomColor: colors.border,
            opacity: pressed ? 0.82 : 1,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={[
                typography.smallLabel,
                {
                  color: accent,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                },
              ]}
            >
              {type?.name ?? entry.typeId}
            </Text>
            <Text
              style={[
                typography.body,
                {
                  color: colors.ink,
                  fontWeight: "600",
                  marginTop: 4,
                },
              ]}
              numberOfLines={2}
            >
              {entry.title}
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "500",
                fontSize: 13,
                lineHeight: 18,
                color: colors.inkSubtle,
                marginTop: 4,
              }}
            >
              {relativeTime(entry.completedAt)}
            </Text>
          </View>

          <SFSymbol
            name="chevron.right"
            size={13}
            color={colors.inkSubtle}
            weight="semibold"
          />
        </View>
      )}
    </Pressable>
  );
}

function EmptyState({ colors }: { colors: ColorPalette }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: colors.surfaceSecondary,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SFSymbol
          name="book.closed.fill"
          size={22}
          color={colors.ink}
          weight="medium"
        />
      </View>
      <Text
        style={{
          fontFamily: "System",
          fontWeight: "700",
          fontSize: 20,
          color: colors.ink,
          marginTop: 20,
          textAlign: "center",
        }}
      >
        Nothing completed yet
      </Text>
      <Text
        style={{
          fontFamily: "System",
          fontWeight: "400",
          fontSize: 15,
          lineHeight: 22,
          color: colors.inkMuted,
          marginTop: 8,
          textAlign: "center",
        }}
      >
        Finish today&apos;s devotional and it will appear here for
        easy re-reading anytime.
      </Text>
    </View>
  );
}

function NavBar({
  colors,
  onBack,
}: {
  colors: ColorPalette;
  onBack: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 8,
      }}
    >
      <Pressable
        onPress={() => {
          haptics.soft();
          onBack();
        }}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        {({ pressed }) => (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.surfaceSecondary,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            }}
          >
            <SFSymbol
              name="chevron.left"
              size={15}
              color={colors.ink}
              weight="semibold"
            />
          </View>
        )}
      </Pressable>
      <View style={{ flex: 1 }} />
    </View>
  );
}
