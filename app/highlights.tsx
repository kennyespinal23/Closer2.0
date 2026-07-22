import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { goBackOr } from "@/lib/navigation";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { SFSymbol } from "@/components/Symbol";
import { minTouchTarget, spacing } from "@/constants/spacing";
import {
  formatRef,
  relativeTime,
  routeForVerse,
} from "@/lib/annotationsFormat";
import * as haptics from "@/lib/haptics";
import { SCREEN_H_PAD } from "@/lib/layout";
import {
  HIGHLIGHT_COLORS,
  type Highlight,
  type HighlightColorId,
  useAnnotations,
} from "@/state/annotations";
import { useColors, useResolvedScheme } from "@/state/theme";

/**
 * All highlighted verses, newest first. Each card carries:
 *   • a colored left stripe matching the verse's highlight color
 *   • the verse reference + relative timestamp
 *   • the verse text (cached at highlight-time)
 *
 * Color filter is a native UISegmentedControl (All + 5 color names)
 * — short fixed option set, same pattern as Appearance / Reading Goal.
 */
const FILTER_VALUES = ["All", ...HIGHLIGHT_COLORS.map((c) => c.name)] as const;

export default function HighlightsScreen() {
  const router = useRouter();
  const { allHighlights } = useAnnotations();
  const highlights = allHighlights();
  const scheme = useResolvedScheme();
  const colors = useColors();

  const [activeFilter, setActiveFilter] = useState<HighlightColorId | null>(
    null,
  );

  const selectedIndex = useMemo(() => {
    if (!activeFilter) return 0;
    const i = HIGHLIGHT_COLORS.findIndex((c) => c.id === activeFilter);
    return i >= 0 ? i + 1 : 0;
  }, [activeFilter]);

  const visible = useMemo(
    () =>
      activeFilter
        ? highlights.filter((h) => h.color.id === activeFilter)
        : highlights,
    [highlights, activeFilter],
  );

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <Header
        title="Highlights"
        countLabel={
          highlights.length > 0 ? `${highlights.length}` : undefined
        }
      />

      {highlights.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: spacing[32] }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              paddingHorizontal: SCREEN_H_PAD,
              paddingTop: spacing[16],
              paddingBottom: spacing[8],
              minHeight: minTouchTarget,
              justifyContent: "center",
            }}
          >
            <SegmentedControl
              appearance={scheme}
              values={[...FILTER_VALUES]}
              selectedIndex={selectedIndex}
              onChange={(event) => {
                const nextIndex = event.nativeEvent.selectedSegmentIndex;
                haptics.tick();
                if (nextIndex <= 0) {
                  setActiveFilter(null);
                  return;
                }
                const color = HIGHLIGHT_COLORS[nextIndex - 1];
                setActiveFilter(color?.id ?? null);
              }}
              style={styles.segmented}
              fontStyle={{
                fontFamily: "System",
                fontWeight: "500",
                fontSize: 13,
                color: colors.inkMuted,
              }}
              activeFontStyle={{
                fontFamily: "System",
                fontWeight: "700",
                fontSize: 13,
                color: colors.ink,
              }}
            />
          </View>
          {visible.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                marginTop: spacing[32],
                paddingHorizontal: spacing[40],
              }}
            >
              <Text
                className="text-ink-muted text-[13px] text-center"
                style={{ fontFamily: "System", fontWeight: "400" }}
              >
                No verses highlighted in this color yet.
              </Text>
            </View>
          ) : (
            visible.map((h) => (
              <HighlightCard
                key={h.key}
                highlight={h}
                onPress={() => router.push(routeForVerse(h))}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  segmented: {
    // Native control paints at ~32–36; wrap ensures 44pt hit area via parent.
    height: 36,
  },
});

function HighlightCard({
  highlight,
  onPress,
}: {
  highlight: Highlight;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
        minHeight: minTouchTarget,
      })}
      className="mx-5 mt-3 rounded-2xl border border-border bg-surface overflow-hidden flex-row"
    >
      <View
        style={{
          width: 5,
          backgroundColor: highlight.color.swatch,
        }}
      />
      <View className="flex-1 px-5 py-4">
        <View className="flex-row items-baseline justify-between">
          <Text
            className="text-primary text-[11px] tracking-[1px] uppercase"
            style={{ fontFamily: "System", fontWeight: "700" }}
          >
            {formatRef(highlight)}
          </Text>
          <Text
            className="text-ink-muted text-[11px]"
            style={{ fontFamily: "System", fontWeight: "500" }}
          >
            {relativeTime(highlight.updatedAt)}
          </Text>
        </View>

        {highlight.verseText ? (
          <Text
            className="text-ink text-[15px] mt-2 leading-[22px]"
            style={{ fontFamily: "System", fontWeight: "400" }}
            numberOfLines={4}
          >
            &ldquo;{highlight.verseText}&rdquo;
          </Text>
        ) : (
          <Text
            className="text-ink-muted text-[13px] mt-2 italic"
            style={{ fontFamily: "System", fontWeight: "400" }}
          >
            Tap to open chapter
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <View className="w-14 h-14 rounded-2xl bg-accent-soft border border-border items-center justify-center">
        <View className="flex-row">
          {HIGHLIGHT_COLORS.slice(0, 3).map((c, i) => (
            <View
              key={c.id}
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: c.swatch,
                marginLeft: i === 0 ? 0 : -3,
              }}
            />
          ))}
        </View>
      </View>
      <Text
        className="text-ink text-[18px] mt-5 text-center"
        style={{ fontFamily: "System", fontWeight: "700" }}
      >
        Nothing highlighted yet
      </Text>
      <Text
        className="text-ink-muted text-[13px] mt-2 text-center leading-[20px]"
        style={{ fontFamily: "System", fontWeight: "400" }}
      >
        Tap any verse while reading and pick a color. Highlights gather here
        for easy returning.
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
  const colors = useColors();
  return (
    <View
      className="flex-row items-center pt-2 pb-3"
      style={{ paddingHorizontal: SCREEN_H_PAD }}
    >
      <Pressable
        onPress={() => goBackOr(router, "/(tabs)/profile")}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={{
          width: minTouchTarget,
          height: minTouchTarget,
          borderRadius: minTouchTarget / 2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SFSymbol
          name="chevron.left"
          size={18}
          color={colors.ink}
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
        <View className="px-3 h-10 rounded-full border border-border items-center justify-center">
          <Text
            className="text-ink-muted text-[11px]"
            style={{ fontFamily: "System", fontWeight: "600" }}
          >
            {countLabel}
          </Text>
        </View>
      ) : (
        <View style={{ width: minTouchTarget, height: minTouchTarget }} />
      )}
    </View>
  );
}
