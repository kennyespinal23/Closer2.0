import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
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

          {completed.map((entry, index) => (
            <CompletedSermonRow
              key={entry.id}
              entry={entry}
              colors={colors}
              isFirst={index === 0}
              onPress={() => {
                if (entry.day == null) return;
                haptics.soft();
                router.push(`/saved-sermon/${entry.day}`);
              }}
            />
          ))}
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
  isFirst,
  onPress,
}: {
  entry: SermonCompletion;
  colors: ColorPalette;
  isFirst: boolean;
  onPress: () => void;
}) {
  const moment = entry.day != null ? findMomentByDay(entry.day) : null;
  const type = moment ? resolveSermonType(moment.type) : null;
  const accent = type?.accent ?? colors.primary;
  const artwork = type?.illustration ?? type?.homeHero ?? type?.hero;

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
            marginTop: isFirst ? 0 : 12,
            borderRadius: 20,
            backgroundColor: colors.surfaceSecondary,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
            opacity: pressed ? 0.88 : 1,
          }}
        >
          <View style={{ flexDirection: "row", padding: 14 }}>
            <View
              style={{
                width: 76,
                height: 96,
                borderRadius: 14,
                overflow: "hidden",
                backgroundColor: colors.surfaceTertiary,
              }}
            >
              {artwork ? (
                <Image
                  source={artwork}
                  style={{ width: 76, height: 96 }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SFSymbol
                    name={type?.iconSymbol ?? "book.closed.fill"}
                    size={28}
                    color={accent}
                    weight="medium"
                  />
                </View>
              )}
            </View>

            <View style={{ flex: 1, marginLeft: 14, justifyContent: "center" }}>
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
                  typography.devotionalTitle,
                  {
                    color: colors.ink,
                    fontSize: 22,
                    lineHeight: 28,
                    marginTop: 6,
                  },
                ]}
                numberOfLines={2}
              >
                {entry.title}
              </Text>
              {moment?.teaser ? (
                <Text
                  style={[typography.body, { color: colors.inkMuted, fontSize: 15, lineHeight: 22, marginTop: 8 }]}
                  numberOfLines={2}
                >
                  {firstParagraph(moment.teaser)}
                </Text>
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 12,
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 13, lineHeight: 18 }} allowFontScaling={false}>
                    🕐
                  </Text>
                  <Text
                    style={{
                      fontFamily: "System",
                      fontWeight: "500",
                      fontSize: 13,
                      lineHeight: 18,
                      color: colors.inkSubtle,
                      marginLeft: 5,
                    }}
                  >
                    {relativeTime(entry.completedAt)}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: "System",
                    fontWeight: "600",
                    fontSize: 13,
                    color: colors.ink,
                  }}
                >
                  Read again
                </Text>
                <SFSymbol
                  name="chevron.right"
                  size={11}
                  color={colors.inkSubtle}
                  weight="semibold"
                />
              </View>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

function firstParagraph(text: string): string {
  return text.split(/\n\n+/)[0]?.trim() ?? text.trim();
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
