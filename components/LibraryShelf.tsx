import { BookReaderPreparation } from "@/app/book/[id]/[chapter]";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image as NativeImage, Pressable, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { cancelAnimation, Easing, withTiming, runOnJS, useAnimatedStyle, useSharedValue, withSpring, type SharedValue } from "react-native-reanimated";
import { Image } from "expo-image";
import { getBookCover } from "@/constants/bookCovers";
import { useFocusEffect, useRouter } from "expo-router";
import { Text } from "./CloserText";
import { LibraryBookCover, type LibraryBookFrame } from "./LibraryBookcase";
import { SFSymbol } from "./Symbol";
import { type Book } from "@/constants/books";
import { getBookTheme } from "@/constants/bookBlurbs";
import { findExpressBook } from "@/constants/expressBooks";
import { useProgress } from "@/state/progress";
import { useColors, useResolvedScheme } from "@/state/theme";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { systemText, uiText, typography } from "@/lib/typography";
import { buttonStyles } from "@/lib/buttonStyles";
import { paperActionColors } from "@/lib/paperControls";
import * as haptics from "@/lib/haptics";

const STEP = 112;
const SHELF_EASE = Easing.bezier(.2, .8, .2, 1);
const SPRING = { stiffness: 230, damping: 28, mass: .85, overshootClamping: true };

/** A bounded deck, not overlapping virtualized cells. All drag geometry runs on the UI thread. */
export function LibraryShelf({ books, selectedId, onSelect, onJump, onPick, departure }: {
  departure: SharedValue<number>;
  books: readonly Book[]; selectedId: string; onSelect: (book: Book) => void; onJump: (book: Book) => void;
  onPick: (book: Book, frame: LibraryBookFrame, chapter?: number) => void;
}) {
  const { width, height, fontScale } = useWindowDimensions();
  const reduced = useReducedMotion(), colors = useColors(), router = useRouter();
  const action = paperActionColors(useResolvedScheme() === "dark");
  const { chaptersRead, lastVisited, hasReadChapter } = useProgress();
  const deckRef = useRef<View>(null);
  const lift = useSharedValue(0);
  const navigationClock = useSharedValue(0);
  const [readyKey, setReadyKey] = useState("");
  const [pendingOpen, setPendingOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const openingRef = useRef(false);
  useFocusEffect(useCallback(() => {
    openingRef.current = false;
    setOpening(false);
    departure.value = withTiming(0, { duration: reduced ? 0 : 500, easing: SHELF_EASE });
  }, [reduced, departure]));

  const index = Math.max(0, books.findIndex(book => book.id === selectedId));
  const book = books[index];
  const position = useSharedValue(index), start = useSharedValue(index), moving = useSharedValue(false);
  const detailsStyle = useAnimatedStyle(() => ({
    opacity: 1 - departure.value,
    transform: [{ translateY: reduced ? 0 : departure.value * 16 }],
  }));
  // Keep the action row and testament shortcuts clear of the tab bar on short phones.
  const coverWidth = Math.min(196, width * .505, height * .21);
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
  useEffect(() => { if (!moving.value) { cancelAnimation(position); position.value = index; start.value = index; } }, [index, books]);
  useEffect(() => () => { cancelAnimation(position); cancelAnimation(navigationClock); }, []);
  const pan = Gesture.Pan().enabled(!opening && !pendingOpen).activeOffsetX([-10, 10]).failOffsetY([-14, 14])
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
      runOnJS(settled)(target);
      if (reduced) { position.value = target; moving.value = false; }
      else position.value = withTiming(target, { duration: 500, easing: SHELF_EASE }, finished => {
        if (finished) { moving.value = false; }
      });
    })
    .onFinalize((_, success) => {
      if (!success && moving.value) position.value = withSpring(index, SPRING, finished => { if (finished) moving.value = false; });
    });
  const select = (target: number) => {
    cancelAnimation(position);
    moving.value = true;
    settled(target);
    if (reduced) { position.value = target; moving.value = false; }
    else position.value = withTiming(target, { duration: 500, easing: SHELF_EASE }, finished => { if (finished) { moving.value = false; } });
  };
  const read = new Set(chaptersRead.filter(item => item.bookId === book.id && item.chapter >= 1 && item.chapter <= book.chapters).map(item => item.chapter)).size;
  const last = lastVisited?.bookId === book.id ? lastVisited.chapter : 0;
  const chapter = last > 0 ? Math.min(book.chapters, last + (hasReadChapter(book.id, last) ? 1 : 0)) : 1;
  const beginOpen = () => {
    if (moving.value || openingRef.current) return;
    openingRef.current = true;
    setOpening(true);
    haptics.soft();
    deckRef.current?.measureInWindow((_, y) => {
      const frame = { x: (width - coverWidth) / 2, y: y + 10, width: coverWidth, height: coverWidth * 1.42 };
      if (reduced) { onPick(book, frame, chapter); return; }
      // HTML Continue: 380ms lift, reader fade begins 230ms into it.
      // Both Start and Continue go directly to Scripture, as requested.
      lift.value = height * .339 - frame.y;
      departure.value = withTiming(1, { duration: 380, easing: SHELF_EASE });
      const navigate = () => onPick(book, frame, chapter);
      navigationClock.value = 0;
      navigationClock.value = withTiming(1, { duration: 230 }, finished => {
        if (finished) runOnJS(navigate)();
      });
    });
  };
  const preparationKey = `${book.id}:${chapter}`;
  const open = () => {
    if (moving.value || openingRef.current || pendingOpen) return;
    if (readyKey !== preparationKey) { setPendingOpen(true); return; }
    beginOpen();
  };
  useEffect(() => {
    if (pendingOpen && readyKey === preparationKey) {
      setPendingOpen(false);
      beginOpen();
    }
  }, [pendingOpen, readyKey, preparationKey]);
  const visible = books.slice(Math.max(0, index - 4), index + 5);
  return <View>
    <BookReaderPreparation key={`${book.id}:${chapter}`} bookId={book.id} chapter={chapter} onReady={() => setReadyKey(preparationKey)} />
    <GestureDetector gesture={pan}>
      <View ref={deckRef} collapsable={false} style={{ height: coverWidth * 1.42 + 32, marginTop: 16, overflow: "visible" }}>
        {visible.map(item => <ShelfCover key={item.id} book={item} index={books.indexOf(item)} position={position} departure={departure} lift={lift} width={coverWidth} reduced={reduced}
          selected={item.id === book.id} onPress={() => item.id === book.id ? open() : select(books.indexOf(item))} />)}
      </View>
    </GestureDetector>
    <Animated.View pointerEvents={opening ? "none" : "auto"} style={[{ paddingHorizontal: 24, gap: 6 }, detailsStyle]}>
      <Text style={{ ...systemText.footnote, fontWeight: "700", color: colors.textSecondary }}>{book.testament === "old" ? "Old Testament" : "New Testament"} · {book.category}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text accessibilityRole="header" style={{ ...typography.devotionalTitle, fontWeight: "900", flex: 1, color: colors.ink }}>{book.name}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`About ${book.name}`} onPress={() => { if (moving.value) return; haptics.soft(); router.push(`/book/${book.id}`); }} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
          <SFSymbol name="info.circle" size={22} color={colors.textSecondary}/>
        </Pressable>
      </View>
      <Text style={{ fontSize: 16, lineHeight: 23, fontWeight: "600", color: colors.textSecondary, minHeight: 44, flexShrink: 0 }}>{getBookTheme(book.id)}</Text>
      {read > 0 && <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: book.chapters, now: read, text: `${read} of ${book.chapters} chapters read` }} style={{ flex: 1, height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: colors.border }}>
          <View style={{ width: `${read / book.chapters * 100}%`, height: 8, borderRadius: 4, backgroundColor: colors.ink }} />
        </View>
        <Text style={{ ...systemText.footnote, fontVariant: ["tabular-nums"], color: colors.textSecondary }}>{read} of {book.chapters}</Text>
      </View>}
      <View style={{ flexDirection: fontScale > 1.2 ? "column" : "row", gap: 12, marginTop: 16 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={last ? `Continue ${book.name} chapter ${chapter}` : `Start reading ${book.name}`} onPress={open} accessibilityState={{ busy: pendingOpen, disabled: pendingOpen || opening }} disabled={pendingOpen || opening}
          style={[buttonStyles.primary, { flex: fontScale > 1.2 ? undefined : 1, backgroundColor: action.backgroundColor }]}>
          <Text style={[buttonStyles.label, { color: action.color }]}>{pendingOpen ? "Preparing chapter…" : last ? `Continue · Ch. ${chapter}` : "Start reading"}</Text>
        </Pressable>
        {findExpressBook(book.id) && <Pressable accessibilityRole="button" accessibilityLabel={`Read ${book.name} Express`} onPress={() => { if (moving.value) return; haptics.soft(); router.push(`/book/${book.id}/express`); }}
          style={[buttonStyles.primary, { paddingHorizontal: 18, flexDirection: "row", gap: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }]}>
          <SFSymbol name="bolt" size={17} color={colors.ink} /><Text style={[buttonStyles.label, { color: colors.ink }]}>Express</Text>
        </Pressable>}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12, gap: 8 }}>
        {(["old", "new"] as const).map(testament => {
          const first = books.find(candidate => candidate.testament === testament);
          return first ? <Pressable key={testament} accessibilityRole="button" accessibilityLabel={`Jump to ${testament === "old" ? "Old" : "New"} Testament`} onPress={() => { haptics.tick(); onJump(first); }} style={{ minHeight: 44, justifyContent: "center", flexShrink: 1 }}>
            <Text style={[buttonStyles.textLabel, { color: colors.textSecondary, textAlign: testament === "old" ? "left" : "right" }]}>{testament === "old" ? "Old Testament" : "New Testament"}</Text>
          </Pressable> : null;
        })}
      </View>
    </Animated.View>
  </View>;
}

function ShelfCover({ book, index, position, departure, lift, width, reduced, selected, onPress }: {
  book: Book; index: number; position: SharedValue<number>; departure: SharedValue<number>; lift: SharedValue<number>; width: number; reduced: boolean; selected: boolean;
  onPress: () => void;
}) {
  const animated = useAnimatedStyle(() => {
    const distance = index - position.value, a = Math.abs(distance), sign = distance < 0 ? -1 : 1;
    // Exact geometry from the HTML: first neighbor 118pt away, subsequent neighbors another 60pt.
    const x = sign * (Math.min(a, 1) * 118 + Math.max(0, a - 1) * 60);
    return { zIndex: 100 - Math.round(a * 10), opacity: a > 2.6 ? 0 : selected ? 1 : 1 - departure.value, transform: [
      { translateX: x + (selected ? 0 : sign * 260 * departure.value) }, { translateY: reduced ? 0 : a * 16 + (selected ? lift.value * departure.value : 0) },
      { rotate: `${reduced ? 0 : distance * 7}deg` }, { scale: Math.max(.6, 1 - .16 * a) * (selected ? 1 + .18 * departure.value : 1) },
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
