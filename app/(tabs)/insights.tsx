import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { FadeIn } from "@/components/FadeIn";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import {
  ArticleHero,
  hexWithAlpha,
} from "@/components/insight/ArticleHero";
import {
  INSIGHT_CATEGORIES,
  insightsInCategory,
  type Insight,
  type InsightCategory,
} from "@/constants/insights";
import { useColors } from "@/state/theme";
/**
 * Insights — content library.
 *
 * This tab is the magazine. Each article is a short, contemplative
 * read on a foundational topic (grace, prayer, doubt, etc.). The
 * surface is intentionally calm and scannable:
 *
 *   • Page eyebrow + title at the top
 *   • Featured rail — the first article in each category, full-bleed
 *   • One rail per category below — horizontal scroll of all entries
 *
 * What this tab is NOT:
 *   • The personal stats / streak view. That lives in /stats now
 *     and is reached from the Profile drawer ("Your Practice"). The
 *     reason we moved it: a "data tab" and a "content tab" have
 *     fundamentally different reading rhythms — mixing them dilutes
 *     both. The drawer entry preserves the path for users who want
 *     to check their numbers.
 *
 * Saved articles: the bookmark action on a detail page still
 * persists into SavedInsightsProvider — the data is there for a
 * future "Saved" list — but we don't surface a Saved rail here.
 * The index feels calmer without it on day one when most users
 * have zero or one save.
 *
 * Why no search/filter yet:
 *   • The catalog is small (single digits). When it grows past a
 *     dozen entries we'll add a search bar at the top + tags. Until
 *     then it's noise.
 */
export default function InsightsScreen() {
  const router = useRouter();

  // Featured = the first insight in the first category. Stable while
  // the catalog has a single entry per category; later this can be
  // hand-curated via an editor's `featured` flag.
  const featured = useMemo(() => {
    const first = INSIGHT_CATEGORIES[0];
    if (!first) return null;
    return insightsInCategory(first.id)[0] ?? null;
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Page header ─────────────────────────────────────── */}
        <FadeIn delayMs={0} durationMs={700}>
          <View className="px-6 pt-2">
            <Text
              className="text-ink-subtle text-[12px] uppercase tracking-[2px]"
              style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
            >
              Closer
            </Text>
            <Text
              className="text-ink text-[28px] leading-[34px] tracking-[-0.4px] mt-2"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Insights
            </Text>
            <Text
              className="text-ink-muted text-[13.5px] leading-[20px] mt-1.5"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Short, contemplative reads on the things faith asks of us.
            </Text>
          </View>
        </FadeIn>

        {/* ─── Featured ─────────────────────────────────────────
            A distinct moment in the page rhythm. The header has its
            own sparkle glyph + accent-tinted backdrop so the user
            reads it as "this one's special", not as just-another-rail
            section heading. */}
        {featured && (
          <FadeIn delayMs={150} durationMs={900}>
            <FeaturedSection
              insight={featured}
              onPress={() => router.push(`/insight/${featured.id}`)}
            />
          </FadeIn>
        )}

        {/* ─── A rail per category ────────────────────────────── */}
        {INSIGHT_CATEGORIES.map((cat, idx) => (
          <CategoryRail
            key={cat.id}
            category={cat}
            delayMs={350 + idx * 100}
            onSelect={(i) => router.push(`/insight/${i.id}`)}
          />
        ))}

        {/* ─── Soft footer ────────────────────────────────────── */}
        <FadeIn delayMs={650} durationMs={900}>
          <View className="px-6 mt-12">
            <Text
              className="text-ink-muted text-[12.5px] leading-[20px] text-center"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              More reads added each week.
            </Text>
          </View>
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Featured card — full-bleed hero, magazine cover energy
// ─────────────────────────────────────────────────────────────────

/**
 * Hero card. Renders the article's hero image if provided; falls
 * back to a typographic cover sampled from the article's palette
 * (so launch quality is high even before art lands).
 */
/**
 * The Featured section — header + cover, treated as a single visual
 * moment.
 *
 * Layout decisions:
 *   • Header is a centered pill (sparkle ✦ + "FEATURED" + sparkle)
 *     with a hairline rule trailing on either side, magazine-cover
 *     style. The pill picks up a soft accent-tinted background so
 *     the eye lands on it before anything else.
 *   • Cover is centered at ~64% of the screen width — substantial
 *     but no longer dominating the viewport. The reduced size lets
 *     the rail beneath start to peek above the fold on most iPhones.
 *   • A soft palette glow halos behind the cover so it visually
 *     pops off the page even when surrounded by other dark sections.
 */
function FeaturedSection({
  insight,
  onPress,
}: {
  insight: Insight;
  onPress: () => void;
}) {
  return (
    <View className="mt-8">
      <FeaturedHeader accent={insight.palette.accent} />
      <View className="mt-5">
        {insight.coverIncludesTitle ? (
          <FeaturedCoverHero insight={insight} onPress={onPress} />
        ) : (
          <FeaturedIllustrativeCard insight={insight} onPress={onPress} />
        )}
      </View>
    </View>
  );
}

/**
 * Centered "FEATURED" eyebrow with sparkle glyphs and a hairline
 * rule on either side. Treats featured as a curated moment, not a
 * heading.
 */
function FeaturedHeader({ accent }: { accent: string }) {
  return (
    <View className="flex-row items-center px-6">
      {/* Left rule — fades to the eyebrow. */}
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: hexWithAlpha(accent, 0.35),
        }}
      />
      <View
        className="flex-row items-center mx-3 px-3 py-1.5 rounded-full"
        style={{
          backgroundColor: hexWithAlpha(accent, 0.16),
          borderWidth: 1,
          borderColor: hexWithAlpha(accent, 0.32),
        }}
      >
        <SparkleIcon color={accent} size={11} />
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: accent,
            fontSize: 10.5,
            letterSpacing: 2.5,
            marginHorizontal: 8,
            textTransform: "uppercase",
          }}
        >
          Featured
        </Text>
        <SparkleIcon color={accent} size={11} />
      </View>
      {/* Right rule — mirrors the left. */}
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: hexWithAlpha(accent, 0.35),
        }}
      />
    </View>
  );
}

/**
 * Cover-mode featured card.
 *
 * Renders the book-cover artwork at ~64% screen width, centered.
 * The cover's own internal palette + framing carry all the visual
 * weight — no halo, no surrounding chrome, just the artwork.
 */
function FeaturedCoverHero({
  insight,
  onPress,
}: {
  insight: Insight;
  onPress: () => void;
}) {
  const { width: screenWidth } = useWindowDimensions();
  // Capped so it stays sensible on iPad — and small enough on phones
  // that the start of the Faith Basics rail peeks at the bottom of
  // the screen, cueing the swipe to read more.
  const coverWidth = Math.min(280, Math.round(screenWidth * 0.64));

  return (
    <View className="items-center justify-center">
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
      >
        <ArticleHero
          insight={insight}
          height={0}
          coverWidth={coverWidth}
        />
      </Pressable>
    </View>
  );
}

/**
 * Fallback featured layout for articles whose cover artwork does NOT
 * include the title. The original captioned-hero treatment.
 */
function FeaturedIllustrativeCard({
  insight,
  onPress,
}: {
  insight: Insight;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
      className="px-6"
    >
      <View
        className="rounded-3xl overflow-hidden border border-border"
        style={{ backgroundColor: insight.palette.bg }}
      >
        <ArticleHero insight={insight} height={220} />
        {/* Caption strip flips with the theme so the body copy
            (text-ink, text-ink-muted) stays legible. Was hardcoded
            #0F0F0F which became black-on-black in light mode. */}
        <View
          className="px-5 py-5"
          style={{ backgroundColor: colors.surface }}
        >
          <Text
            className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            Faith Basics · {insight.readMinutes} min read
          </Text>
          <Text
            className="text-ink text-[22px] leading-[27px] tracking-[-0.3px] mt-2"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            {insight.title}
          </Text>
          <Text
            className="text-ink-muted text-[13px] leading-[19px] mt-2"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            numberOfLines={2}
          >
            {insight.subtitle}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * A four-pointed sparkle ✦. Matches the cross-glyph weight on the
 * cover artwork so it reads as related-but-different (a star, not
 * another cross). Used as the bookend on the Featured header.
 */
function SparkleIcon({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z"
        fill={color}
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Category rail — eyebrow + a horizontal scroller of cards
// ─────────────────────────────────────────────────────────────────

function CategoryRail({
  category,
  delayMs,
  onSelect,
}: {
  category: InsightCategory;
  delayMs: number;
  onSelect: (i: Insight) => void;
}) {
  const items = useMemo(() => insightsInCategory(category.id), [category.id]);
  if (items.length === 0) return null;
  return (
    <FadeIn delayMs={delayMs} durationMs={900}>
      <View className="mt-9">
        <CategoryHeader title={category.label} subtitle={category.blurb} />
        <InsightRail insights={items} onSelect={onSelect} />
      </View>
    </FadeIn>
  );
}

function CategoryHeader({
  title,
  subtitle,
  count,
}: {
  title: string;
  subtitle?: string;
  count?: number;
}) {
  return (
    <View className="px-6 mb-3">
      <View className="flex-row items-baseline">
        <Text
          className="text-ink text-[18px] tracking-[-0.2px]"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {title}
        </Text>
        {typeof count === "number" && (
          <Text
            className="text-ink-subtle text-[12.5px] ml-2"
            style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
          >
            {count}
          </Text>
        )}
      </View>
      {subtitle && (
        <Text
          className="text-ink-muted text-[12.5px] leading-[18px] mt-1"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

/**
 * Horizontal scroller of article cards.
 *
 * Cards are mixed-width: standard "illustrative-hero + caption strip"
 * cards take one width (~78% of column) so the headline copy is
 * readable; book-cover thumbnails take a narrower portrait width
 * (~150pt) so 2½ covers peek on screen at once and the rail reads
 * like a bookshelf.
 *
 * Mixing widths in a single horizontal ScrollView works because each
 * card knows its own width — we let the cards measure themselves
 * rather than imposing a uniform width here.
 */
function InsightRail({
  insights,
  onSelect,
}: {
  insights: ReadonlyArray<Insight>;
  onSelect: (i: Insight) => void;
}) {
  const SIDE_GAP = 24;
  const CARD_GAP = 14;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: SIDE_GAP,
        paddingRight: SIDE_GAP,
        alignItems: "flex-end",
      }}
    >
      {insights.map((insight, idx) => (
        <View
          key={insight.id}
          style={{
            marginRight: idx === insights.length - 1 ? 0 : CARD_GAP,
          }}
        >
          <InsightCard insight={insight} onPress={() => onSelect(insight)} />
        </View>
      ))}
    </ScrollView>
  );
}

/**
 * Standard card — hero on top, caption beneath. Matches FeaturedCard
 * stylistically but smaller and used in rails.
 */
/**
 * A single card in the horizontal rail. Two completely different
 * layouts gate on whether the article's cover artwork is self-titled:
 *
 *   • cover-mode: a portrait book-thumbnail (~150pt wide) with NO
 *     caption strip — the artwork carries everything. Multiple
 *     thumbs peek on screen so the rail reads as a bookshelf.
 *   • caption-mode: a wider card (~280pt) with a small hero band on
 *     top and the title + subtitle in a dark strip beneath, since
 *     the typographic fallback doesn't carry the title itself.
 */
function InsightCard({
  insight,
  onPress,
}: {
  insight: Insight;
  onPress: () => void;
}) {
  if (insight.coverIncludesTitle === true) {
    return <CoverThumbCard insight={insight} onPress={onPress} />;
  }
  return <CaptionedCard insight={insight} onPress={onPress} />;
}

/**
 * Book-cover card for articles with self-titled cover artwork.
 *
 * Sized large — ~78% of screen width — so each cover dominates the
 * rail and reads as a substantial standalone thing the user can
 * swipe through, not a tiny tile. Roughly 1.1 covers visible at a
 * time on a standard iPhone, with the next cover peeking in to
 * cue the swipe affordance.
 *
 * Renders without rounded corners or a card border so the cover
 * artwork (which has its own internal framing) speaks for itself.
 */
function CoverThumbCard({
  insight,
  onPress,
}: {
  insight: Insight;
  onPress: () => void;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const coverWidth = Math.round(screenWidth * 0.78);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <ArticleHero insight={insight} height={0} coverWidth={coverWidth} />
    </Pressable>
  );
}

/**
 * Standard captioned rail card — used for any article that does NOT
 * have its title baked into the cover artwork.
 */
function CaptionedCard({
  insight,
  onPress,
}: {
  insight: Insight;
  onPress: () => void;
}) {
  const colors = useColors();
  const CARD_W = 280;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <View
        className="rounded-2xl overflow-hidden border border-border"
        style={{ backgroundColor: insight.palette.bg, width: CARD_W }}
      >
        <ArticleHero insight={insight} height={150} />
        {/* Same theme-flip as FeaturedIllustrativeCard above. */}
        <View
          className="px-4 py-4"
          style={{ backgroundColor: colors.surface }}
        >
          <Text
            className="text-ink-subtle text-[10px] tracking-[2px] uppercase"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            numberOfLines={1}
          >
            {insight.readMinutes} min read
          </Text>
          <Text
            className="text-ink text-[16px] leading-[20px] tracking-[-0.2px] mt-1.5"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            numberOfLines={2}
          >
            {insight.title}
          </Text>
          <Text
            className="text-ink-muted text-[12px] leading-[16px] mt-1.5"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            numberOfLines={2}
          >
            {insight.subtitle}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

