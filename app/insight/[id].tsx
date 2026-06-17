import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { SFSymbol } from "@/components/Symbol";
import { FadeIn } from "@/components/FadeIn";
import { shareInsight } from "@/lib/share";
import {
  ArticleHero,
  hexWithAlpha,
} from "@/components/insight/ArticleHero";
import {
  findCategory,
  findInsight,
  resolveRelated,
  type Insight,
  type InsightBlock,
} from "@/constants/insights";
import { useSavedInsights } from "@/state/savedInsights";
import { useColors } from "@/state/theme";

/**
 * Insight (article) detail screen.
 *
 * Magazine-style: hero illustration sets the article's mood, then
 * the body unfolds in deliberate typography. Goals for the read:
 *
 *   • Calm vertical rhythm — generous line height + tight
 *     paragraph spacing so it reads like a printed page rather than
 *     a UI surface.
 *   • One typographic level per block kind (paragraph, lead, quote,
 *     scripture). Easier to skim, gives the writer dynamic range.
 *   • Save / Share / Copy live in a floating bottom bar so they're
 *     always one tap away without competing with the words.
 *
 * The route is registered as drill-down in the root layout. Coming
 * from the Insights tab, the standard back gesture / chevron returns
 * the user to the rail they tapped from.
 */
export default function InsightDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { width: screenWidth } = useWindowDimensions();

  // All hooks unconditionally — the early-return for "not found"
  // sits AFTER hook declarations so hook order stays stable across
  // renders (rules-of-hooks). When `insight` is null we still pay
  // the cost of these hooks, but they no-op cheaply.
  const insight = useMemo(() => findInsight(id), [id]);
  const related = useMemo(
    () => (insight ? resolveRelated(insight.related) : []),
    [insight],
  );
  const { isSaved, toggle } = useSavedInsights();

  if (!insight) return <InsightNotFound onBack={() => router.back()} />;

  // The book-cover artwork is the article's opening title page —
  // it should take the full screen width so the user feels like
  // they cracked open a book, not a thumbnail. Capped only to keep
  // very wide tablet viewports from generating absurdly tall heroes.
  const detailCoverWidth = Math.min(screenWidth, 720);

  const category = findCategory(insight.category);
  const saved = isSaved(insight.id);

  const handleShare = async () => {
    await shareInsight({
      title: insight.title,
      subtitle: insight.subtitle,
    });
  };

  const openScripture = (
    block: Extract<InsightBlock, { kind: "scriptureRef" }>,
  ) => {
    // Mirror the check-in flow: focus the verse + glow it with the
    // article's accent color so the visual ties the reader back to
    // the article they came from.
    const tint = encodeURIComponent(insight.palette.accent);
    router.push(
      `/book/${block.bookId}/${block.chapter}?focus=${block.verse}&tint=${tint}` as never,
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top chrome ──────────────────────────────────────
            Two presentations depending on whether the cover artwork
            already has its own title/eyebrow:

              • Book-cover mode (coverIncludesTitle = true)
                — Render a normal top-bar ABOVE the hero so the
                  cover artwork stays pristine and the back chevron
                  doesn't fight the cover's "INSIGHT" eyebrow.
              • Illustrative-hero mode (default)
                — Float Back + Save as translucent chips OVER the
                  hero, magazine-detail-page style. */}
        {insight.coverIncludesTitle ? (
          <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Back"
              className="w-10 h-10 rounded-full items-center justify-center"
            >
              <BackChevronIcon />
            </Pressable>
            <Pressable
              onPress={() => toggle(insight.id)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={saved ? "Unsave article" : "Save article"}
              className="w-10 h-10 rounded-full items-center justify-center"
            >
              <BookmarkIcon filled={saved} size={18} />
            </Pressable>
          </View>
        ) : (
          <View
            className="flex-row items-center justify-between px-4"
            style={{
              position: "absolute",
              top: 8,
              left: 0,
              right: 0,
              zIndex: 10,
            }}
          >
            <RoundChip onPress={() => router.back()} accessibilityLabel="Back">
              <BackChevronIcon />
            </RoundChip>
            <RoundChip
              onPress={() => toggle(insight.id)}
              accessibilityLabel={saved ? "Unsave article" : "Save article"}
            >
              <BookmarkIcon filled={saved} />
            </RoundChip>
          </View>
        )}

        {/* ─── Hero ───────────────────────────────────────────
            Two presentations:
              • Cover-mode: full-bleed, edge-to-edge book cover.
                The artwork IS the article's opening — no padding,
                no rounded corners, just the cover the way a hardback
                opens.
              • Illustrative-mode: a fixed-height illustrated band
                with the title block beneath. */}
        {insight.coverIncludesTitle ? (
          <ArticleHero
            insight={insight}
            height={0}
            coverWidth={detailCoverWidth}
          />
        ) : (
          <View className="overflow-hidden">
            <ArticleHero insight={insight} height={340} />
          </View>
        )}

        {/* ─── Title block ─────────────────────────────────────
            Skipped entirely when the cover artwork already includes
            the title + subtitle + read-time as part of the design.
            Otherwise we render the standard magazine intro under the
            hero. */}
        {!insight.coverIncludesTitle && (
          <FadeIn delayMs={100} durationMs={700}>
            <View className="px-6 mt-6">
              <Text
                className="text-ink-subtle text-[11px] tracking-[2.5px] uppercase"
                style={{ fontFamily: "System", fontWeight: "700" }}
              >
                {category ? category.label : "Insight"} ·{" "}
                {insight.readMinutes} min read
              </Text>
              <Text
                className="text-ink text-[30px] leading-[36px] tracking-[-0.5px] mt-3"
                style={{ fontFamily: "System", fontWeight: "700" }}
              >
                {insight.title}
              </Text>
              <Text
                className="text-ink-muted text-[15px] leading-[22px] mt-3"
                style={{ fontFamily: "System", fontWeight: "400" }}
              >
                {insight.subtitle}
              </Text>
              {/* Accent rule — palette tint, sized like a printed
                  "section break" rather than a UI divider. */}
              <View
                style={{
                  marginTop: 24,
                  height: 3,
                  width: 36,
                  borderRadius: 2,
                  backgroundColor: insight.palette.accent,
                }}
              />
            </View>
          </FadeIn>
        )}

        {/* ─── Body ─────────────────────────────────────────────
            When the cover holds the title, we still want a small
            accent rule at the top of the body to mark the
            cover→body transition (otherwise the first paragraph
            butts up against the artwork). */}
        <FadeIn delayMs={200} durationMs={900}>
          <View className="px-6 mt-6">
            {insight.coverIncludesTitle && (
              <View
                style={{
                  alignSelf: "center",
                  marginTop: 6,
                  marginBottom: 18,
                  height: 3,
                  width: 36,
                  borderRadius: 2,
                  backgroundColor: insight.palette.accent,
                }}
              />
            )}
            {insight.body.map((block, i) => (
              <BlockRenderer
                key={i}
                block={block}
                insight={insight}
                onScripturePress={openScripture}
              />
            ))}
          </View>
        </FadeIn>

        {/* ─── Closing rule ───────────────────────────────────── */}
        <View
          style={{
            marginTop: 36,
            alignSelf: "center",
            width: 24,
            height: 2,
            borderRadius: 1,
            backgroundColor: insight.palette.accent,
            opacity: 0.6,
          }}
        />

        {/* ─── Related rail ──────────────────────────────────── */}
        {related.length > 0 && (
          <View className="mt-12 px-6">
            <Text
              className="text-ink-subtle text-[11px] tracking-[2.5px] uppercase mb-3"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              Read next
            </Text>
            {related.map((r, i) => (
              <RelatedRow
                key={r.id}
                insight={r}
                onPress={() => router.push(`/insight/${r.id}`)}
                showDivider={i < related.length - 1}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ─── Bottom action bar ─────────────────────────────────
          Floats above the safe-area bottom edge. Save / Share /
          Copy — the three most likely actions after reading. */}
      <BottomActionBar
        saved={saved}
        accent={insight.palette.accent}
        onToggleSave={() => toggle(insight.id)}
        onShare={handleShare}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Body block renderer
// ─────────────────────────────────────────────────────────────────

/**
 * Maps an InsightBlock to its visual treatment. Kept as a single
 * switch (rather than per-kind components) because each treatment is
 * compact and the read order is easier to scan in one place.
 *
 * Typography ladder (top → bottom):
 *   • lead       — 22pt, semi-bold, optical-tight       → article hinge
 *   • pullQuote  — 19pt italic w/ accent stripe         → moment to land on
 *   • scripture  — bordered card, monospace-ish label   → tappable verse
 *   • paragraph  — 17pt, line-height 26                 → body workhorse
 *   • bulletList — 16pt with hand-drawn-feel dot        → list moments
 *   • divider    — 1px hairline                         → section breaks
 */
function BlockRenderer({
  block,
  insight,
  onScripturePress,
}: {
  block: InsightBlock;
  insight: Insight;
  onScripturePress: (
    b: Extract<InsightBlock, { kind: "scriptureRef" }>,
  ) => void;
}) {
  const colors = useColors();
  switch (block.kind) {
    case "paragraph":
      return (
        <Text
          className="text-ink text-[17px] mt-5"
          style={{
            fontFamily: "System",
            fontWeight: "400",
            lineHeight: 26,
          }}
        >
          {block.text}
        </Text>
      );

    case "lead":
      return (
        <Text
          className="text-ink text-[22px] mt-7"
          style={{
            fontFamily: "System",
            fontWeight: "700",
            lineHeight: 30,
            letterSpacing: -0.3,
          }}
        >
          {block.text}
        </Text>
      );

    case "pullQuote":
      return (
        <View
          className="mt-7 pl-5 py-2"
          style={{
            borderLeftWidth: 3,
            borderLeftColor: insight.palette.accent,
          }}
        >
          <Text
            className="text-ink text-[19px]"
            style={{
              fontFamily: "System",
              fontWeight: "500",
              fontStyle: "italic",
              lineHeight: 28,
            }}
          >
            “{block.text}”
          </Text>
          {block.attribution && (
            <Text
              className="text-ink-subtle text-[12.5px] mt-2"
              style={{ fontFamily: "System", fontWeight: "600" }}
            >
              — {block.attribution}
            </Text>
          )}
        </View>
      );

    case "scriptureRef":
      return (
        <Pressable
          onPress={() => onScripturePress(block)}
          style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
          className="mt-6"
        >
          <View
            style={{
              borderRadius: 16,
              padding: 16,
              backgroundColor: hexWithAlpha(insight.palette.accent, 0.10),
              borderWidth: 1,
              borderColor: hexWithAlpha(insight.palette.accent, 0.30),
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="text-[11px] tracking-[2.5px] uppercase"
                style={{
                  fontFamily: "System",
                  fontWeight: "700",
                  color: insight.palette.accent,
                }}
              >
                {block.reference}
              </Text>
              <OpenIcon color={insight.palette.accent} />
            </View>
            {block.text && (
              <Text
                className="text-ink text-[15.5px] mt-2.5"
                style={{
                  fontFamily: "System",
                  fontWeight: "500",
                  lineHeight: 23,
                  fontStyle: "italic",
                }}
              >
                “{block.text}”
              </Text>
            )}
          </View>
        </Pressable>
      );

    case "bulletList":
      return (
        <View className="mt-5">
          {block.items.map((item, i) => (
            <View key={i} className="flex-row mt-2.5">
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  marginTop: 10,
                  marginRight: 12,
                  backgroundColor: insight.palette.accent,
                }}
              />
              <Text
                className="text-ink text-[16.5px] flex-1"
                style={{
                  fontFamily: "System",
                  fontWeight: "400",
                  lineHeight: 25,
                }}
              >
                {item}
              </Text>
            </View>
          ))}
        </View>
      );

    case "divider":
      return (
        <View
          style={{
            height: 1,
            marginVertical: 24,
            backgroundColor: colors.border,
          }}
        />
      );
  }
}

// ─────────────────────────────────────────────────────────────────
// Related row — compact horizontal card
// ─────────────────────────────────────────────────────────────────

function RelatedRow({
  insight,
  onPress,
  showDivider,
}: {
  insight: Insight;
  onPress: () => void;
  showDivider?: boolean;
}) {
  const colors = useColors();
  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
      >
        <View className="flex-row items-center py-3.5">
          {/* Mini hero — a 64-square swatch with the article's
              monogram-fallback so each row feels like its own thing. */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              overflow: "hidden",
              marginRight: 14,
              backgroundColor: insight.palette.bg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "800",
                fontSize: 32,
                color: insight.palette.ink,
                opacity: 0.9,
                lineHeight: 32,
              }}
            >
              {/* Reuse the initial-extraction by reading first char of
                  the title's first non-stop word. Inline to avoid an
                  extra import cycle. */}
              {extractInitial(insight.title)}
            </Text>
          </View>

          <View className="flex-1 pr-2">
            <Text
              className="text-ink text-[15px] leading-[20px]"
              style={{ fontFamily: "System", fontWeight: "700" }}
              numberOfLines={2}
            >
              {insight.title}
            </Text>
            <Text
              className="text-ink-subtle text-[12px] mt-1"
              style={{ fontFamily: "System", fontWeight: "500" }}
              numberOfLines={1}
            >
              {insight.readMinutes} min · {insight.subtitle}
            </Text>
          </View>

          <ChevronIcon />
        </View>
      </Pressable>
      {showDivider && <View style={{ height: 1, backgroundColor: colors.border }} />}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Bottom action bar
// ─────────────────────────────────────────────────────────────────

/**
 * Floating tab-bar-style action strip at the bottom of the article.
 * Two stacked layers:
 *   1. A solid bg-bg block that occupies the safe-area inset, so the
 *      content above doesn't show through the home indicator area.
 *   2. The pill itself — rounded, bordered, three actions.
 *
 * Save toggles instantly (with a small accent fill when saved) so the
 * user gets feedback without a route change.
 */
function BottomActionBar({
  saved,
  accent,
  onToggleSave,
  onShare,
}: {
  saved: boolean;
  accent: string;
  onToggleSave: () => void;
  onShare: () => void;
}) {
  const colors = useColors();
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingBottom: 18,
        // Soft gradient-feel falloff above the bar so body text fades
        // into it rather than getting hard-cut. Implemented as a
        // single solid block (we keep the dependency list lean).
        backgroundColor: "transparent",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 999,
          paddingVertical: 10,
          paddingHorizontal: 8,
          shadowColor: "#000",
          shadowOpacity: 0.5,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 12,
        }}
      >
        <ActionPill
          label={saved ? "Saved" : "Save"}
          icon={<BookmarkIcon filled={saved} size={16} />}
          tint={saved ? accent : undefined}
          onPress={onToggleSave}
          flex
        />
        <View style={{ width: 6 }} />
        <ActionPill
          label="Share"
          icon={<ShareIcon />}
          onPress={onShare}
          flex
        />
      </View>
    </View>
  );
}

function ActionPill({
  label,
  icon,
  onPress,
  tint,
  flex,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  tint?: string;
  flex?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={flex ? { flex: 1 } : undefined}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          height: 44,
          borderRadius: 999,
          backgroundColor: tint ? hexWithAlpha(tint, 0.18) : "transparent",
        }}
      >
        {icon}
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "700",
            fontSize: 13.5,
            color: tint ?? colors.ink,
            marginLeft: 8,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Not-found state — when /insight/[id] resolves to no match
// ─────────────────────────────────────────────────────────────────

function InsightNotFound({ onBack }: { onBack: () => void }) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <Pressable
          onPress={onBack}
          hitSlop={12}
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <BackChevronIcon />
        </Pressable>
        <Text
          className="text-ink text-[17px] flex-1 text-center"
          style={{ fontFamily: "System", fontWeight: "700" }}
        >
          Insight
        </Text>
        <View className="w-10 h-10" />
      </View>
      <View className="flex-1 items-center justify-center px-8">
        <Text
          className="text-ink text-[18px] text-center"
          style={{ fontFamily: "System", fontWeight: "700" }}
        >
          We couldn&apos;t find that read.
        </Text>
        <Text
          className="text-ink-muted text-[14px] text-center mt-2"
          style={{ fontFamily: "System", fontWeight: "400" }}
        >
          Head back to Insights to pick another.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Chrome bits
// ─────────────────────────────────────────────────────────────────

/**
 * A circular translucent button. Used for the floating Back / Save
 * controls over the hero where any palette color might be the
 * backdrop. Backdrop-blur isn't available without a native module so
 * we approximate with a high-opacity dark fill — still legible over
 * the brightest palette we ship (the cream of "What Is Grace?").
 */
function RoundChip({
  onPress,
  children,
  accessibilityLabel,
}: {
  onPress: () => void;
  children: React.ReactNode;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "rgba(0,0,0,0.55)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function extractInitial(title: string): string {
  const STOP = new Set([
    "what",
    "is",
    "the",
    "a",
    "an",
    "of",
    "and",
    "or",
    "for",
    "to",
  ]);
  const tokens = title
    .replace(/[?.!]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  for (const t of tokens) {
    if (!STOP.has(t.toLowerCase())) return t.charAt(0).toUpperCase();
  }
  return (tokens[0] ?? "•").charAt(0).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

function BackChevronIcon() {
  const colors = useColors();
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 6l-6 6 6 6"
        stroke={colors.ink}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BookmarkIcon({
  filled,
  size = 16,
}: {
  filled?: boolean;
  size?: number;
}) {
  const colors = useColors();
  // SF Symbol has both filled and outline variants of bookmark;
  // we just switch the symbol name based on `filled`, keeping
  // the tint identical so the toggle reads as the same icon
  // with a fill change.
  return (
    <SFSymbol
      name={filled ? "bookmark.fill" : "bookmark"}
      size={size}
      color={colors.ink}
      weight="medium"
    />
  );
}

function ShareIcon() {
  const colors = useColors();
  return (
    <SFSymbol
      name="square.and.arrow.up"
      size={16}
      color={colors.ink}
      weight="medium"
    />
  );
}

function OpenIcon({ color }: { color: string }) {
  // SF Symbol equivalent of the "open in new" arrow-out-of-box
  // glyph used by Safari, Mail, and most Apple share contexts.
  return (
    <SFSymbol
      name="arrow.up.right.square"
      size={14}
      color={color}
      weight="medium"
    />
  );
}

function ChevronIcon() {
  const colors = useColors();
  return (
    <SFSymbol
      name="chevron.right"
      size={12}
      color={colors.inkSubtle}
      weight="semibold"
    />
  );
}
