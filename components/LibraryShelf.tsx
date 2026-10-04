import { useCallback, useEffect, useRef } from "react";
import { Image as NativeImage, Pressable, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from "react-native-reanimated";
import { Image } from "expo-image";
import { getBookCover } from "@/constants/bookCovers";
import { useRouter } from "expo-router";
import { Text } from "./CloserText";
import { LibraryBookCover, type LibraryBookFrame } from "./LibraryBookcase";
import { SFSymbol } from "./Symbol";
import { type Book } from "@/constants/books";
import { getBookTheme } from "@/constants/bookBlurbs";
import { findExpressBook } from "@/constants/expressBooks";
import { useProgress } from "@/state/progress";
import { useColors, useResolvedScheme } from "@/state/theme";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { systemText, uiText } from "@/lib/typography";
import { buttonStyles } from "@/lib/buttonStyles";
import { paperActionColors } from "@/lib/paperControls";
import * as haptics from "@/lib/haptics";

const STEP = 112;
const SPRING = { stiffness: 230, damping: 28, mass: .85, overshootClamping: true };

/** A bounded deck, not overlapping virtualized cells. All drag geometry runs on the UI thread. */
export function LibraryShelf({ books, selectedId, onSelect, onJump, onPick }: {
  books: readonly Book[]; selectedId: string; onSelect: (book: Book) => void; onJump: (book: Book) => void;
  onPick: (book: Book, frame: LibraryBookFrame) => void;
}) {
  const { width, fontScale } = useWindowDimensions();
  const reduced = useReducedMotion(), colors = useColors(), router = useRouter();
  const action = paperActionColors(useResolvedScheme() === "dark");
  const { chaptersRead, lastVisited, hasReadChapter } = useProgress();
  const deckRef = useRef<View>(null);
  const index = Math.max(0, books.findIndex(book => book.id === selectedId));
  const book = books[index];
  const position = useSharedValue(index), start = useSharedValue(index), moving = useSharedValue(false);
  const coverWidth = Math.min(196, width * .505);
  useEffect(() => {
    // Warm only shortcut destinations and their neighbors, not all 66 full-size covers.
    const targets = books.filter((candidate, i) => i < 3 || candidate.testament !== books[i - 1]?.testament || (i > 0 && books[i - 1]?.testament !== books[i - 2]?.testament));
    const urls = targets.map(candidate => { const source = getBookCover(candidate.id); return source ? NativeImage.resolveAssetSource(source)?.uri : undefined; }).filter((uri): uri is string => Boolean(uri));
    if (urls.length) void Image.prefetch(urls, "memory-disk").catch(() => {});
  }, [books]);
  const callbacks = useRef({ books, onSelect });
  callbacks.current = { books, onSelect };
  const settled = useCallback((target: number) => {
    const next = callbacks.current.books[target];
    if (next) callbacks.current.onSelect(next);
  }, []);
  // External selection (testament shortcuts, search, filters) updates the deck without replaying a swipe.
  useEffect(() => { cancelAnimation(position); position.value = index; start.value = index; moving.value = false; }, [index, books]);
  useEffect(() => () => cancelAnimation(position), []);
  const pan = Gesture.Pan().activeOffsetX([-10, 10]).failOffsetY([-14, 14])
    .onStart(() => { cancelAnimation(position); start.value = position.value; moving.value = true; })
    .onUpdate(event => {
      const raw = start.value - event.translationX / STEP;
      // Keep every potentially visible card mounted, including on interrupted flicks.
      const low = Math.max(0, index - 2), high = Math.min(books.length - 1, index + 2);
      position.value = raw < low ? low + (raw - low) * .15 : raw > high ? high + (raw - high) * .15 : raw;
    })
    .onEnd(event => {
      const projected = position.value - event.velocityX / STEP * .12;
      const target = Math.max(0, Math.min(books.length - 1, index + 2, Math.max(index - 2, Math.round(projected))));
      if (reduced) { position.value = target; moving.value = false; runOnJS(settled)(target); }
      else position.value = withSpring(target, { ...SPRING, velocity: -event.velocityX / STEP }, finished => {
        if (finished) { moving.value = false; runOnJS(settled)(target); }
      });
    })
    .onFinalize((_, success) => {
      if (!success && moving.value) position.value = withSpring(index, SPRING, finished => { if (finished) moving.value = false; });
    });
  const select = (target: number) => {
    cancelAnimation(position);
    moving.value = true;
    if (reduced) { position.value = target; moving.value = false; settled(target); }
    else position.value = withSpring(target, SPRING, finished => { if (finished) { moving.value = false; runOnJS(settled)(target); } });
  };
  if (!book) return null;
  const read = new Set(chaptersRead.filter(item => item.bookId === book.id && item.chapter >= 1 && item.chapter <= book.chapters).map(item => item.chapter)).size;
  const last = lastVisited?.bookId === book.id ? lastVisited.chapter : 0;
  const chapter = last > 0 ? Math.min(book.chapters, last + (hasReadChapter(book.id, last) ? 1 : 0)) : 1;
  const open = () => {
    if (moving.value) return;
    haptics.soft();
    deckRef.current?.measureInWindow((_, y) => onPick(book, { x: (width - coverWidth) / 2, y: y + 10, width: coverWidth, height: coverWidth * 1.42 }));
  };
  const visible = books.slice(Math.max(0, index - 4), index + 5);
  return <View>
    <GestureDetector gesture={pan}>
      <View ref={deckRef} collapsable={false} style={{ height: coverWidth * 1.42 + 40, marginTop: 14, overflow: "hidden" }}>
        {visible.map(item => <ShelfCover key={item.id} book={item} index={books.indexOf(item)} position={position} width={coverWidth} reduced={reduced}
          selected={item.id === book.id} onPress={() => item.id === book.id ? open() : select(books.indexOf(item))} />)}
      </View>
    </GestureDetector>
    <View key={`${book.id}-${fontScale}`} style={{ paddingHorizontal: 24, gap: 6 }}>
      <Text style={{ ...systemText.footnote, fontWeight: "700", color: colors.textSecondary }}>{book.testament === "old" ? "Old Testament" : "New Testament"} · {book.category}</Text>
      <Text accessibilityRole="header" style={{ ...uiText.sectionTitle, color: colors.ink }}>{book.name}</Text>
      <Text style={{ ...uiText.supporting, color: colors.textSecondary, minHeight: 44, flexShrink: 0 }}>{getBookTheme(book.id)}</Text>
      {read > 0 && <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: book.chapters, now: read, text: `${read} of ${book.chapters} chapters read` }} style={{ flex: 1, height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: colors.border }}>
          <View style={{ width: `${read / book.chapters * 100}%`, height: 8, borderRadius: 4, backgroundColor: colors.ink }} />
        </View>
        <Text style={{ ...systemText.footnote, fontVariant: ["tabular-nums"], color: colors.textSecondary }}>{read} of {book.chapters}</Text>
      </View>}
      <View style={{ flexDirection: fontScale > 1.2 ? "column" : "row", gap: 10, marginTop: 14 }}>
        <Pressable accessibilityRole="button" onPress={last ? () => { if (moving.value) return; haptics.soft(); router.push(`/book/${book.id}/${chapter}`); } : open}
          style={[buttonStyles.primary, { flex: fontScale > 1.2 ? undefined : 1, backgroundColor: action.backgroundColor }]}>
          <Text style={[buttonStyles.label, { color: action.color }]}>{last ? `Continue · Ch. ${chapter}` : "Open book"}</Text>
        </Pressable>
        {findExpressBook(book.id) && <Pressable accessibilityRole="button" accessibilityLabel={`Read ${book.name} Express`} onPress={() => { if (moving.value) return; haptics.soft(); router.push(`/book/${book.id}/express`); }}
          style={[buttonStyles.primary, { paddingHorizontal: 18, flexDirection: "row", gap: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }]}>
          <SFSymbol name="bolt" size={17} color={colors.ink} /><Text style={[buttonStyles.label, { color: colors.ink }]}>Express</Text>
        </Pressable>}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16, gap: 8 }}>
        {(["old", "new"] as const).map(testament => {
          const first = books.find(candidate => candidate.testament === testament);
          return first ? <Pressable key={testament} accessibilityRole="button" accessibilityLabel={`Jump to ${testament === "old" ? "Old" : "New"} Testament`} onPress={() => { haptics.tick(); onJump(first); }} style={{ minHeight: 44, justifyContent: "center", flexShrink: 1 }}>
            <Text style={[buttonStyles.textLabel, { color: colors.textSecondary, textAlign: testament === "old" ? "left" : "right" }]}>{testament === "old" ? "Old Testament" : "New Testament"}</Text>
          </Pressable> : null;
        })}
      </View>
    </View>
  </View>;
}

function ShelfCover({ book, index, position, width, reduced, selected, onPress }: {
  book: Book; index: number; position: SharedValue<number>; width: number; reduced: boolean; selected: boolean;
  onPress: () => void;
}) {
  const animated = useAnimatedStyle(() => {
    const distance = index - position.value, a = Math.abs(distance), sign = distance < 0 ? -1 : 1;
    // Exact geometry from the HTML: first neighbor 118pt away, subsequent neighbors another 60pt.
    const x = sign * (Math.min(a, 1) * 118 + Math.max(0, a - 1) * 60);
    return { zIndex: 100 - Math.round(a * 10), opacity: a > 2.6 ? 0 : 1, transform: [
      { translateX: x }, { translateY: reduced ? 0 : a * 16 },
      { rotate: `${reduced ? 0 : distance * 7}deg` }, { scale: Math.max(.6, 1 - .16 * a) },
    ] };
  });
  const dim = useAnimatedStyle(() => ({ opacity: Math.min(.55, Math.abs(index - position.value) * .28) }));
  return <Animated.View style={[{ position: "absolute", left: "50%", marginLeft: -width / 2, top: 10, width, height: width * 1.42 }, animated]}>
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${selected ? "Open" : "Select"} ${book.name}`} onPress={onPress}>
      <LibraryBookCover book={book} width={width} />
      <Animated.View pointerEvents="none" style={[{ position: "absolute", inset: 0, backgroundColor: "#000", borderRadius: 4 }, dim]} />
    </Pressable>
  </Animated.View>;
}
