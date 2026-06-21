import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SFSymbol } from "@/components/Symbol";
import { FROSTED_CHROME_INK, FROSTED_CHROME_PILL } from "@/constants/heroChrome";
import { relativeTime } from "@/lib/annotationsFormat";
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
  const { sermonCompletions } = useProgress();

  const completed = useMemo(
    () => dedupeCompletionsByDay(sermonCompletions),
    [sermonCompletions],
  );

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <Header
        title="Completed"
        countLabel={
          completed.length > 0
            ? `${completed.length}`
            : undefined
        }
      />

      {completed.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {completed.map((entry) => (
            <CompletedSermonRow
              key={entry.id}
              entry={entry}
              onPress={() => {
                if (entry.day == null) return;
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
  onPress,
}: {
  entry: SermonCompletion;
  onPress: () => void;
}) {
  const colors = useColors();
  const moment = entry.day != null ? findMomentByDay(entry.day) : null;
  const type = moment ? resolveSermonType(moment.type) : null;
  const accent = type?.accent ?? colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={entry.day == null}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      className="mx-5 mt-3 rounded-2xl border border-border bg-surface overflow-hidden"
    >
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: 4, backgroundColor: accent }} />
        <View className="flex-1 px-5 py-4">
          <View className="flex-row items-baseline justify-between">
            <Text
              className="text-[11px] tracking-[2px] uppercase"
              style={{
                fontFamily: "System",
                fontWeight: "700",
                color: accent,
              }}
            >
              {type?.name ?? entry.typeId}
            </Text>
            <Text
              className="text-ink-subtle text-[11px]"
              style={{ fontFamily: "System", fontWeight: "500" }}
            >
              {relativeTime(entry.completedAt)}
            </Text>
          </View>
          <Text
            className="text-ink text-[16px] mt-2 leading-[22px]"
            style={{ fontFamily: "System", fontWeight: "700" }}
            numberOfLines={2}
          >
            {entry.title}
          </Text>
          {moment?.teaser ? (
            <Text
              className="text-ink-muted text-[14px] mt-2 leading-[20px]"
              style={{ fontFamily: "System", fontWeight: "400" }}
              numberOfLines={2}
            >
              {firstParagraph(moment.teaser)}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function firstParagraph(text: string): string {
  return text.split(/\n\n+/)[0]?.trim() ?? text.trim();
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <View style={FROSTED_CHROME_PILL}>
        <SFSymbol
          name="book.closed.fill"
          size={18}
          color={FROSTED_CHROME_INK}
          weight="medium"
        />
      </View>
      <Text
        className="text-ink text-[18px] mt-5 text-center"
        style={{ fontFamily: "System", fontWeight: "700" }}
      >
        No completed sermons yet
      </Text>
      <Text
        className="text-ink-muted text-[13.5px] mt-2 text-center leading-[20px]"
        style={{ fontFamily: "System", fontWeight: "400" }}
      >
        Finish today&apos;s devotional and it will show up here for
        easy re-reading.
      </Text>
    </View>
  );
}

function Header({
  title,
  countLabel,
}: {
  title: string;
  countLabel?: string;
}) {
  const router = useRouter();
  return (
    <View className="flex-row items-center px-5 pt-2 pb-3">
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={({ pressed }) => ({
          ...FROSTED_CHROME_PILL,
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <SFSymbol
          name="chevron.left"
          size={15}
          color={FROSTED_CHROME_INK}
          weight="semibold"
        />
      </Pressable>
      <Text
        className="text-ink text-[17px] flex-1 text-center"
        style={{ fontFamily: "System", fontWeight: "700" }}
      >
        {title}
      </Text>
      {countLabel ? (
        <View
          style={{
            ...FROSTED_CHROME_PILL,
            width: undefined,
            minWidth: 44,
            paddingHorizontal: 14,
          }}
        >
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              color: FROSTED_CHROME_INK,
              fontSize: 14,
              lineHeight: 18,
            }}
          >
            {countLabel}
          </Text>
        </View>
      ) : (
        <View style={{ width: 44, height: 44 }} />
      )}
    </View>
  );
}
