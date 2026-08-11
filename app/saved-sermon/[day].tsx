import { useMemo } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { BubbleBackButton } from "@/components/BubbleBackButton";
import { goBackOr } from "@/lib/navigation";
import { findMomentByDay } from "@/lib/moments";
import { NEW_YORK, systemText, typography } from "@/lib/typography";
import { HIGHLIGHT_COLORS } from "@/state/annotations";
import { useProgress } from "@/state/progress";
import { useColors } from "@/state/theme";

const PAPER_INK = "#1A1510";

/**
 * Expanded completed reading — opens from Saved pins.
 * Colored date header matches the pin preview; body uses page
 * title → reference → verse → story hierarchy.
 */
export default function SavedDevotionalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const router = useRouter();
  const { sermonCompletions } = useProgress();
  const { day: dayParam, accent: accentParam } = useLocalSearchParams<{
    day?: string;
    accent?: string;
  }>();
  const day = Number(dayParam);
  const moment = Number.isFinite(day) ? findMomentByDay(day) : null;

  const completion = useMemo(
    () =>
      sermonCompletions
        .filter((c) => c.day === day)
        .sort((a, b) => b.completedAt - a.completedAt)[0] ?? null,
    [sermonCompletions, day],
  );

  const headerColor = useMemo(() => {
    if (typeof accentParam === "string" && /^#[0-9A-Fa-f]{6,8}$/.test(accentParam)) {
      return accentParam;
    }
    const i = Number.isFinite(day) ? Math.max(0, day - 1) : 0;
    return HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length]!.swatch;
  }, [accentParam, day]);

  const dateLabel = useMemo(() => {
    const ms = completion?.completedAt ?? Date.now();
    return new Date(ms)
      .toLocaleDateString("en-US", { month: "short", day: "numeric" })
      .toUpperCase();
  }, [completion?.completedAt]);

  const paragraphs = useMemo(() => {
    if (!moment) return [];
    return moment.story
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [moment]);

  if (!moment) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ padding: 24 }}>
          <Text style={[typography.body, { color: colors.ink }]}>
            This day isn’t in the catalog anymore.
          </Text>
          <View style={{ marginTop: 16 }}>
            <BubbleBackButton
              onPress={() => goBackOr(router, "/completed-sermons")}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          backgroundColor: headerColor,
          paddingTop: insets.top + 8,
          paddingBottom: 28,
          paddingHorizontal: 16,
          alignItems: "center",
          justifyContent: "center",
          minHeight: insets.top + 88,
        }}
      >
        <View
          style={{
            position: "absolute",
            left: 16,
            top: insets.top + 8,
            zIndex: 2,
          }}
        >
          <BubbleBackButton
            onPress={() => goBackOr(router, "/completed-sermons")}
            color="#FFFFFF"
            backgroundColor="rgba(26,21,16,0.55)"
          />
        </View>

        <Text
          style={[
            systemText.title1,
            {
              color: PAPER_INK,
              textAlign: "center",
              letterSpacing: 0.8,
              marginTop: 4,
            },
          ]}
          allowFontScaling={false}
        >
          {dateLabel}
        </Text>

        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -1,
            height: 12,
          }}
        >
          <TornEdge width={windowWidth} fill={colors.bg} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 28,
          paddingBottom: 56,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[systemText.title1, { color: colors.ink }]}>
          {moment.title}
        </Text>

        <Text
          style={[
            typography.smallLabel,
            {
              color: colors.inkMuted,
              textTransform: "uppercase",
              marginTop: 12,
            },
          ]}
        >
          {moment.reference}
        </Text>

        <Text
          style={{
            fontFamily: NEW_YORK,
            fontWeight: "400",
            fontSize: 18,
            lineHeight: 30,
            color: colors.ink,
            marginTop: 24,
          }}
        >
          {moment.verse}
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginVertical: 24,
          }}
        />

        {paragraphs.map((p, i) => (
          <Text
            key={i}
            style={[
              typography.body,
              { color: colors.ink, marginBottom: 16 },
            ]}
          >
            {p}
          </Text>
        ))}

        {moment.insight.trim() ? (
          <>
            <Text
              style={[
                typography.smallLabel,
                {
                  color: colors.inkMuted,
                  textTransform: "uppercase",
                  marginTop: 8,
                },
              ]}
            >
              Insight
            </Text>
            <Text
              style={[typography.body, { color: colors.ink, marginTop: 8 }]}
            >
              {moment.insight}
            </Text>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function TornEdge({ width, fill }: { width: number; fill: string }) {
  const h = 12;
  const step = 8;
  const parts: string[] = [`M 0 ${h}`];
  for (let x = 0; x <= width; x += step) {
    const y = Math.floor(x / step) % 2 === 0 ? 0 : h * 0.55;
    parts.push(`L ${Math.min(x, width)} ${y}`);
  }
  parts.push(`L ${width} ${h}`, `L 0 ${h}`, "Z");

  return (
    <Svg width={width} height={h}>
      <Path d={parts.join(" ")} fill={fill} />
    </Svg>
  );
}
