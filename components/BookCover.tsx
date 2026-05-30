import { Image, Text, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Rect,
  Stop,
} from "react-native-svg";
import type { Book } from "@/constants/books";
import {
  CATEGORY_COVER_PALETTE,
  getBookCover,
} from "@/constants/bookCovers";

type Variant = "thumb" | "card" | "hero";

/**
 * One unified way to render a book "cover" across the app.
 *
 * If the book has registered art in constants/bookCovers.ts we
 * render the actual image. Otherwise we render a tasteful
 * placeholder — a vertical gradient tinted to the book's category
 * (so The Law, Wisdom, Apocalyptic, etc. all read as visually
 * distinct sections of the canon) with the book's abbreviation
 * centered in elegant typography.
 *
 * Three variants, picked by the consumer:
 *   • thumb — small list-row cell (Library list)
 *   • card  — medium card grid cell (future use)
 *   • hero  — full-bleed top of the book overview screen
 *
 * The component is intentionally dumb: it doesn't know anything
 * about layout boundaries beyond its own aspect-ratio (3:4). Wrap
 * it in a sized View to control its on-screen footprint.
 */
export function BookCover({
  book,
  variant,
  style,
  imageStyle,
}: {
  book: Book;
  variant: Variant;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}) {
  const cover = getBookCover(book.id);
  const radius = radiusForVariant(variant);

  if (cover) {
    return (
      <View
        style={[
          {
            borderRadius: radius,
            overflow: "hidden",
            backgroundColor: "#0A0A0A",
            aspectRatio: 3 / 4,
          },
          style,
        ]}
      >
        <Image
          source={cover}
          resizeMode="cover"
          style={[{ width: "100%", height: "100%" }, imageStyle]}
        />
      </View>
    );
  }

  return <BookCoverPlaceholder book={book} variant={variant} style={style} />;
}

// ─────────────────────────────────────────────────────────────────
// Placeholder — gradient tinted by category + book abbreviation
// ─────────────────────────────────────────────────────────────────

function BookCoverPlaceholder({
  book,
  variant,
  style,
}: {
  book: Book;
  variant: Variant;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = CATEGORY_COVER_PALETTE[book.category];
  const radius = radiusForVariant(variant);
  const eyebrow = eyebrowForVariant(variant);
  const label = labelForVariant(variant);

  return (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: "hidden",
          aspectRatio: 3 / 4,
        },
        style,
      ]}
    >
      {/* SVG fills the whole tile — sized via parent width/height
          rather than fixed pixels so it always matches the wrapper. */}
      <Svg
        width="100%"
        height="100%"
        // 100x133 ≈ 3:4 — viewBox values just need to share the
        // ratio; the gradient stops are percentage-based so they
        // scale cleanly regardless of width.
        viewBox="0 0 100 133"
        preserveAspectRatio="none"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Defs>
          <LinearGradient
            id={`cover-${book.id}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <Stop offset="0%" stopColor={palette.top} />
            <Stop offset="100%" stopColor={palette.bottom} />
          </LinearGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={100}
          height={133}
          fill={`url(#cover-${book.id})`}
        />
      </Svg>

      {/* Type sits above the gradient. Hero variant gets a top
          eyebrow with the category label; smaller variants drop it
          so the abbreviation can breathe. */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 10,
          paddingVertical: 12,
          alignItems: "center",
          justifyContent: variant === "thumb" ? "center" : "space-between",
        }}
      >
        {variant !== "thumb" && (
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: eyebrow.fontSize,
              letterSpacing: eyebrow.letterSpacing,
              color: palette.accent,
              textTransform: "uppercase",
              opacity: 0.85,
              textAlign: "center",
            }}
            numberOfLines={1}
          >
            {book.category}
          </Text>
        )}

        <View
          style={{
            flex: variant === "thumb" ? undefined : 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_800ExtraBold",
              fontSize: label.fontSize,
              letterSpacing: label.letterSpacing,
              color: "#FFFFFF",
              textAlign: "center",
            }}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {variant === "hero" ? book.name : book.abbr}
          </Text>
        </View>

        {variant === "hero" && (
          <Text
            style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              fontSize: 11,
              color: palette.accent,
              opacity: 0.75,
              letterSpacing: 1.2,
            }}
          >
            {book.chapters} {book.chapters === 1 ? "CHAPTER" : "CHAPTERS"}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Variant tuning
// ─────────────────────────────────────────────────────────────────

function radiusForVariant(v: Variant): number {
  switch (v) {
    case "thumb":
      return 8;
    case "card":
      return 14;
    case "hero":
      return 20;
  }
}

function eyebrowForVariant(v: Variant) {
  switch (v) {
    case "thumb":
      return { fontSize: 7, letterSpacing: 0.8 };
    case "card":
      return { fontSize: 9, letterSpacing: 1.2 };
    case "hero":
      return { fontSize: 11, letterSpacing: 2 };
  }
}

function labelForVariant(v: Variant) {
  switch (v) {
    case "thumb":
      return { fontSize: 14, letterSpacing: -0.2 };
    case "card":
      return { fontSize: 18, letterSpacing: -0.3 };
    case "hero":
      return { fontSize: 38, letterSpacing: -0.6 };
  }
}
