import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import {
  formatRef,
  relativeTime,
  routeForVerse,
} from "@/lib/annotationsFormat";
import { SCREEN_H_PAD } from "@/lib/layout";
import {
  HIGHLIGHT_COLORS,
  type Highlight,
  type HighlightColorId,
  useAnnotations,
} from "@/state/annotations";
import { useColors } from "@/state/theme";

/**
 * All highlighted verses, newest first. Each card carries:
 *   • a colored left stripe matching the verse's highlight color
 *   • the verse reference + relative timestamp
 *   • the verse text (cached at highlight-time)
 *
 * A color filter strip across the top lets the user narrow down to
 * one color — useful when they've adopted a personal color code
 * (e.g. amber = promise, ocean = command).
 */
export default function HighlightsScreen() {
  const router = useRouter();
  const { allHighlights } = useAnnotations();
  const highlights = allHighlights();

  const [activeFilter, setActiveFilter] = useState<HighlightColorId | null>(
    null,
  );

  // Per-color totals (regardless of which filter is currently
  // selected) — used both for the filter swatches' "active" state
  // and for the empty filter result message.
  const counts = useMemo(() => {
    const c: Partial<Record<HighlightColorId, number>> = {};
    for (const h of highlights) {
      c[h.color.id] = (c[h.color.id] ?? 0) + 1;
    }
    return c;
  }, [highlights]);

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
          highlights.length > 0
            ? `${highlights.length}`
            : undefined
        }
      />

      {highlights.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <ColorFilterRow
            counts={counts}
            active={activeFilter}
            onChange={setActiveFilter}
          />
          {visible.length === 0 ? (
            <View className="items-center mt-16 px-10">
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

// ─────────────────────────────────────────────────────────────────
// Filter row — color swatches across the top
// ─────────────────────────────────────────────────────────────────

function ColorFilterRow({
  counts,
  active,
  onChange,
}: {
  counts: Partial<Record<HighlightColorId, number>>;
  active: HighlightColorId | null;
  onChange: (next: HighlightColorId | null) => void;
}) {
  const colors = useColors();
  return (
    <View className="px-5 pt-4 pb-1 flex-row items-center">
      {/* "All" pill */}
      <Pressable
        onPress={() => onChange(null)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="All colors"
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          marginRight: 12,
        })}
      >
        <View
          className={`h-9 px-3.5 rounded-full items-center justify-center border ${
            active === null ? "border-primary bg-accent-soft" : "border-border"
          }`}
        >
          <Text
            className="text-ink text-[12px]"
            style={{ fontFamily: "System", fontWeight: "700" }}
          >
            All
          </Text>
        </View>
      </Pressable>

      {HIGHLIGHT_COLORS.map((c) => {
        const total = counts[c.id] ?? 0;
        const selected = active === c.id;
        return (
          <Pressable
            key={c.id}
            onPress={() => onChange(selected ? null : c.id)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${c.name} (${total})`}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : total === 0 ? 0.35 : 1,
              marginRight: 10,
            })}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: c.swatch,
                borderWidth: selected ? 2.5 : 0,
                borderColor: colors.ink,
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────

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
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      className="mx-5 mt-3 rounded-2xl border border-border bg-surface overflow-hidden flex-row"
    >
      {/* Color stripe — the visual cue that this is a highlight,
          and which color the user picked. */}
      <View
        style={{
          width: 5,
          backgroundColor: highlight.color.swatch,
        }}
      />
      <View className="flex-1 px-5 py-4">
        <View className="flex-row items-baseline justify-between">
          <Text
            className="text-primary text-[11px] tracking-[2.5px] uppercase"
            style={{ fontFamily: "System", fontWeight: "700" }}
          >
            {formatRef(highlight)}
          </Text>
          <Text
            className="text-ink-subtle text-[11px]"
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

// ─────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────

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
        Tap any verse while reading and pick a color. Highlights
        gather here for easy returning.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Header (duplicated with notes.tsx — small enough that the cost of
// inline duplication is lower than the cost of a new shared file)
// ─────────────────────────────────────────────────────────────────

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
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
        className="w-11 h-11 rounded-full items-center justify-center"
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 6l-6 6 6 6"
            stroke={colors.ink}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
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
        <View className="w-11 h-11" />
      )}
    </View>
  );
}
