import { searchStyles } from "@/lib/searchStyles";
import { LibraryGuidedPath } from "@/components/LibraryGuidedPath";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { getBookCover } from "@/constants/bookCovers";
import { paintedCover } from "@/constants/paintedCovers";
import { getBookTheme } from "@/constants/bookBlurbs";
import { LibraryEnvironment } from "@/components/LibraryEnvironment";
import { type LibraryBookFrame } from "@/components/LibraryBookcase";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { BookReaderPreparation } from "@/app/book/[id]/[chapter]";
import { BibleIntroScreen } from "@/components/BibleIntroScreen";
import { loadJSON, saveJSON, STORAGE_KEYS } from "@/lib/storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Modal, FlatList, Keyboard, ScrollView, StyleSheet, Text as NText, View } from "react-native";
import { TextInput, Text } from "@/components/CloserText";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect, type Href } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";
import { SFSymbol } from "@/components/Symbol";
import { BookCover } from "@/components/BookCover";
import { ThemedText } from "@/components/ThemedText";
import { type Book, BOOKS, findBookById } from "@/constants/books";
import { K, nunito } from "@/components/closer/kit";
import * as haptics from "@/lib/haptics";
import { fill, plural, useStrings } from "@/lib/i18n";
import { computeContinueReading } from "@/lib/continueReading";
import { SCREEN_H_PAD } from "@/lib/layout";
import { useProgress } from "@/state/progress";
import { useColors, useResolvedScheme } from "@/state/theme";
import { MOMENTS_IN_ORDER } from "@/lib/momentOrder";
import { getBibleMomentArt } from "@/constants/bibleMomentArt";
import { useBibleMomentCollection } from "@/state/bibleMoments";

// The search sheet keeps the app canvas colours.
const useLibraryColors = useColors;
const GUTTER = 20;
const GREEN = "#58A65C";

/**
 * Library, in the closer-page prototype's look: the book you left off on, edge to edge on its painted cover,
 * the testaments and the reading path as chunky chips, your Bible moments, and every book in one white card
 * with its line and a thin progress bar. Rows open the book's page; the hero goes straight into the reader.
 */
export default function LibraryScreen() {
  const [introduced, setIntroduced] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    loadJSON<boolean>(STORAGE_KEYS.bibleIntro).then(value => { if (active) setIntroduced(value === true); });
    return () => { active = false; };
  }, []);
  if (introduced === null) return <View style={{ flex: 1, backgroundColor: K.cream }} />;
  if (!introduced) return <BibleIntroScreen onComplete={() => {
    setIntroduced(true);
    void saveJSON(STORAGE_KEYS.bibleIntro, true);
  }} />;
  return <LibraryEnvironment><BibleLibrary /></LibraryEnvironment>;
}

type View3 = "old" | "new" | "path";

function BibleLibrary() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const openingRef = useRef(false);
  const s = useStrings().native.bible;
  useFocusEffect(useCallback(() => { openingRef.current = false; }, []));
  const { lastVisited, hasReadChapter, chaptersRead } = useProgress();
  const continueReading = useMemo(() => computeContinueReading(lastVisited, hasReadChapter), [lastVisited, hasReadChapter]);
  const [view, setView] = useState<View3>(() => continueReading?.book.testament ?? "old");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchSession, setSearchSession] = useState(0);

  const readCount = useMemo(() => {
    const by = new Map<string, Set<number>>();
    for (const c of chaptersRead) { const b = findBookById(c.bookId); if (b && c.chapter >= 1 && c.chapter <= b.chapters) by.set(c.bookId, (by.get(c.bookId) ?? new Set()).add(c.chapter)); }
    return (id: string) => by.get(id)?.size ?? 0;
  }, [chaptersRead]);

  const openReader = (book: Book, chapter: number) => {
    if (openingRef.current) return;
    openingRef.current = true;
    haptics.soft();
    router.push({ pathname: "/book/[id]/[chapter]", params: { id: book.id, chapter: String(chapter), libraryReader: "1" } });
  };
  const openBook = (book: Book) => { haptics.soft(); router.push(`/book/${book.id}` as Href); };
  const pickFromPath = (book: Book, _frame: LibraryBookFrame) => {
    const last = lastVisited?.bookId === book.id ? lastVisited.chapter : 0;
    openReader(book, last ? Math.min(book.chapters, last + (hasReadChapter(book.id, last) ? 1 : 0)) : 1);
  };
  const changeView = (next: View3) => { haptics.tick(); setView(next); };

  const hero = continueReading?.book ?? findBookById("john")!;
  const heroCh = continueReading?.chapter ?? 1;
  const books = BOOKS.filter(b => b.testament === (view === "path" ? "new" : view));

  return (
    <View style={{ flex: 1, backgroundColor: K.cream }}>
      {focused && <StatusBar style="light" />}
      <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Hero book={hero} chapter={heroCh} started={!!continueReading} read={readCount(hero.id)} topInset={insets.top}
          onSearch={() => { setSearchSession(n => n + 1); setSearchOpen(true); }}
          onBook={() => openBook(hero)} onRead={() => openReader(hero, heroCh)} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 8, paddingTop: 20 }}>
          <Chip label={s.old} selected={view === "old"} onPress={() => changeView("old")} />
          <Chip label={s.new} selected={view === "new"} onPress={() => changeView("new")} />
          <Chip label={`✦ ${s.path}`} selected={view === "path"} onPress={() => changeView("path")} />
        </ScrollView>

        <MomentsCard onPress={() => { haptics.soft(); router.push("/rhythm?section=moments" as Href); }} />

        {view === "path" ? <View style={{ marginTop: 8 }}><LibraryGuidedPath onPick={pickFromPath} /></View> : (
          <View style={{ marginHorizontal: GUTTER, marginTop: 16, marginBottom: 4 }}>
            <View style={{ position: "absolute", left: 0, right: 0, top: 4, bottom: -4, borderRadius: 26, backgroundColor: "#EADFCC" }} />
            <View style={{ borderRadius: 26, borderCurve: "continuous", overflow: "hidden", backgroundColor: "#FFFFFF" }}>
              {books.map((b, i) => <BookRow key={b.id} book={b} first={i === 0} read={readCount(b.id)} onPress={() => openBook(b)} />)}
            </View>
          </View>
        )}
      </ScrollView>
      <BibleSearch key={searchSession} visible={searchOpen} onClose={() => setSearchOpen(false)} onPick={book => { setSearchOpen(false); openBook(book); }} />
    </View>
  );
}

/* Where you left off: the book's painting, edge to edge behind the status bar and the title, fading into the
   book's own colour under a white Keep reading pill. A new reader is pointed at John. */
function Hero({ book, chapter, started, read, topInset, onSearch, onBook, onRead }: {
  book: Book; chapter: number; started: boolean; read: number; topInset: number;
  onSearch: () => void; onBook: () => void; onRead: () => void;
}) {
  const art = getBookCover(book.id);
  const color = paintedCover(book.id)?.color ?? K.ink;
  const s = useStrings().native.bible;
  const round = { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF33", alignItems: "center" as const, justifyContent: "center" as const };
  const shadow = { textShadowColor: "#00000059", textShadowRadius: 12, textShadowOffset: { width: 0, height: 2 } };
  return <View style={{ backgroundColor: color }}>
    {started && <BookReaderPreparation bookId={book.id} chapter={chapter} />}
    {art != null && <Image source={art} contentFit="cover" transition={0} style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors />}
    <ReaderMaterialGradient pointerEvents="none" colors={["#0000006B", "#0000000D", "#00000040", color]} locations={[0, .32, .55, .96]} style={StyleSheet.absoluteFill} />
    <View style={{ paddingHorizontal: GUTTER, paddingTop: topInset + 12, paddingBottom: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <NText accessibilityRole="header" style={nunito(900, 34, { flex: 1, color: "#FFFFFF", letterSpacing: -1, ...shadow })}>{s.library}</NText>
        <Pressable accessibilityRole="button" accessibilityLabel={s.findBook} onPress={onSearch} style={round}><SFSymbol name="magnifyingglass" size={19} weight="bold" color="#FFFFFF" /></Pressable>
      </View>
      <View style={{ marginTop: 150 }}>
        <NText style={nunito(800, 12.5, { color: "#FFFFFFD9", letterSpacing: 1.75, textTransform: "uppercase" })}>{started ? s.leftOff : s.startHere}</NText>
        <Pressable accessibilityRole="button" accessibilityLabel={fill(s.about, { book: book.name })} onPress={onBook}>
          <NText numberOfLines={2} adjustsFontSizeToFit minimumFontScale={.7} style={nunito(900, 48, { color: "#FFFFFF", letterSpacing: -1.7, lineHeight: 58, marginTop: 6, ...shadow })}>{book.name}</NText>
        </Pressable>
        <NText style={nunito(800, 16, { color: "#FFFFFFE6", marginTop: 6 })}>
          {started ? fill(s.heroStarted, { chapter, of: book.chapters, read }) : plural(book.chapters, s.heroNew)}
        </NText>
        <Pressable accessibilityRole="button" accessibilityLabel={fill(started ? s.keepA11y : s.startA11y, { book: book.name, chapter })} onPress={onRead} style={{ marginTop: 20, alignSelf: "flex-start" }}>
          {({ pressed }) => <View style={{ height: 61 }}>
            <View style={{ position: "absolute", left: 0, right: 0, top: 5, height: 56, borderRadius: 28, backgroundColor: "#00000038" }} />
            <View style={{ height: 56, borderRadius: 28, backgroundColor: "#FFFFFF", paddingHorizontal: 28, flexDirection: "row", alignItems: "center", gap: 10, transform: [{ translateY: pressed ? 4 : 0 }] }}>
              <Svg width={14} height={14} viewBox="0 0 16 16"><Path d="M4 2.5v11l9-5.5z" fill={color} /></Svg>
              <NText style={nunito(900, 18, { color })}>{started ? s.keep : s.start}</NText>
            </View>
          </View>}
        </Pressable>
      </View>
    </View>
  </View>;
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress}
    style={{ height: 44, borderRadius: 22, paddingHorizontal: 18, justifyContent: "center", backgroundColor: selected ? K.ink : K.creamDeep }}>
    <NText style={nunito(900, 15, { color: selected ? K.cream : K.ink })}>{label}</NText>
  </Pressable>;
}

/* Bible moments: the last three you found, fanned out in gold frames, and how many of the 78 you have. */
function MomentsCard({ onPress }: { onPress: () => void }) {
  const { ids } = useBibleMomentCollection();
  const got = MOMENTS_IN_ORDER.filter(m => ids.includes(m.id));
  const order = new Map(ids.map((id, i) => [id, i]));
  const s = useStrings().native.bible;
  const show = [...got].sort((a, b) => (order.get(b.id) ?? 0) - (order.get(a.id) ?? 0)).slice(0, 3);
  return <Pressable accessibilityRole="button" accessibilityLabel={fill(s.momentsA11y, { n: got.length, of: MOMENTS_IN_ORDER.length })} onPress={onPress} style={{ marginHorizontal: GUTTER, marginTop: 16 }}>
    {({ pressed }) => <View style={{ height: 93 }}>
      <View style={{ position: "absolute", left: 0, right: 0, top: 5, height: 88, borderRadius: 24, backgroundColor: "#000000" }} />
      <View style={{ height: 88, borderRadius: 24, backgroundColor: K.ink, flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 16, transform: [{ translateY: pressed ? 4 : 0 }] }}>
        <View style={{ width: 80, height: 62 }}>
          {[2, 1, 0].map(i => {
            const m = show[i], art = m ? getBibleMomentArt(m.id) : undefined;
            return <View key={i} style={{ position: "absolute", left: i * 16, top: 1, width: 45, height: 60, borderRadius: 9, borderWidth: 2, borderColor: K.gold, backgroundColor: "#24342C", overflow: "hidden", alignItems: "center", justifyContent: "center", transform: [{ rotate: `${(i - 1) * 7}deg` }] }}>
              {art ? <Image source={art} contentFit="cover" style={StyleSheet.absoluteFill} /> : <NText style={nunito(900, 18, { color: K.gold })}>?</NText>}
            </View>;
          })}
        </View>
        <View style={{ flex: 1 }}>
          <NText style={nunito(800, 12, { color: K.gold, letterSpacing: 1.7, textTransform: "uppercase" })}>{s.moments}</NText>
          <NText style={nunito(900, 18, { color: K.cream })}>{fill(s.momentsCount, { n: got.length, of: MOMENTS_IN_ORDER.length })}</NText>
          <NText numberOfLines={2} style={nunito(700, 13.5, { color: "#FFF7EBB3" })}>{got.length ? s.momentsMore : s.momentsNone}</NText>
        </View>
      </View>
    </View>}
  </Pressable>;
}

function BookRow({ book, first, read, onPress }: { book: Book; first: boolean; read: number; onPress: () => void }) {
  const art = getBookCover(book.id);
  const done = read >= book.chapters;
  const s = useStrings().native.bible;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${book.name}. ${getBookTheme(book.id) ?? ""}${read ? ` ${fill(s.rowRead, { n: read, of: book.chapters })}` : ""}`} onPress={onPress}
    style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: first ? 0 : 2, borderTopColor: K.cream }}>
    <View style={{ width: 44, height: 69 }}>
      <View style={{ position: "absolute", left: 0, right: 0, top: 3, height: 66, borderRadius: 9, backgroundColor: "#0000002E" }} />
      <View style={{ width: 44, height: 66, borderRadius: 9, overflow: "hidden", backgroundColor: paintedCover(book.id)?.color ?? K.ink }}>
        {art != null && <Image source={art} contentFit="cover" style={StyleSheet.absoluteFill} />}
      </View>
    </View>
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <NText numberOfLines={1} style={nunito(900, 17.5, { color: K.ink, flexShrink: 1 })}>{book.name}</NText>
        {done && <SFSymbol name="checkmark" size={13} weight="heavy" color={GREEN} />}
      </View>
      <NText numberOfLines={2} style={nunito(700, 14, { color: K.inkSoft, lineHeight: 19, marginTop: 2 })}>{getBookTheme(book.id)}</NText>
      {read > 0 && <View accessibilityElementsHidden style={{ marginTop: 8, height: 4, borderRadius: 2, overflow: "hidden", backgroundColor: K.creamDeep }}>
        <View style={{ height: 4, width: `${Math.max(4, read / book.chapters * 100)}%`, borderRadius: 2, backgroundColor: done ? GREEN : K.red }} />
      </View>}
    </View>
  </Pressable>;
}

// ─────────────────────────────────────────────────────────────────
// Search field
// ─────────────────────────────────────────────────────────────────

function BibleSearch({ visible, onClose, onPick }: {
  visible: boolean; onClose: () => void; onPick: (book: Book) => void;
}) {
  const colors = useLibraryColors();
  const scheme = useResolvedScheme();
  const reduced = useReducedMotion();
  const input = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const s = useStrings().native.bible;
  const pendingBook = useRef<Book | null>(null);
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? BOOKS.filter(book => book.name.toLowerCase().includes(normalized) || book.abbr.toLowerCase().includes(normalized)) : [];
  }, [query]);
  const close = () => { Keyboard.dismiss(); onClose(); };
  return <Modal visible={visible} animationType={reduced ? "fade" : "slide"} presentationStyle="pageSheet"
    onRequestClose={close} onDismiss={() => {
      onClose();
      const book = pendingBook.current;
      pendingBook.current = null;
      if (book) onPick(book);
    }} onShow={() => input.current?.focus()}>
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={[searchStyles.field, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SFSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
          <TextInput ref={input} autoFocus defaultValue="" onChangeText={setQuery} placeholder={s.findBook}
            accessibilityLabel={s.searchA11y} placeholderTextColor={colors.textSecondary}
            autoCorrect={false} autoCapitalize="none" clearButtonMode="while-editing" returnKeyType="search"
            keyboardAppearance={scheme} onSubmitEditing={Keyboard.dismiss}
            style={[searchStyles.text, { color: colors.ink }]} />
        </View>
        <Pressable accessibilityRole="button" onPress={close} style={{ minHeight: 44, justifyContent: "center" }}>
          <ThemedText variant="headline">{s.cancel}</ThemedText>
        </Pressable>
      </View>
      <FlatList data={results} keyExtractor={book => book.id} keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingHorizontal: SCREEN_H_PAD, paddingBottom: 24 }}
        ListHeaderComponent={query.trim() ? <ThemedText variant="footnote" color="secondary" style={{ marginBottom: 12 }}>{plural(results.length, s.books)}</ThemedText> : null}
        ListEmptyComponent={query.trim() ? <EmptyState query={query} /> : <View style={{ paddingTop: 28, gap: 8 }}>
          <ThemedText variant="title2">{s.searchTitle}</ThemedText>
          <ThemedText variant="callout" color="secondary">{s.searchHint}</ThemedText>
        </View>}
        renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={fill(s.open, { book: item.name })}
          onPress={() => { pendingBook.current = item; close(); }}
          style={{ flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ width: 42 }}><BookCover book={item} variant="thumb" /></View>
          <View style={{ flex: 1, gap: 4 }}>
            <ThemedText variant="headline">{item.name}</ThemedText>
            <ThemedText variant="footnote" color="secondary">{plural(item.chapters, s.chapters)} · {item.testament === "old" ? s.old : s.new}</ThemedText>
          </View>
          <SFSymbol name="chevron.right" size={14} color={colors.textSecondary} />
        </Pressable>} />
    </SafeAreaView>
  </Modal>;
}

// ─────────────────────────────────────────────────────────────────
// Empty state — shown when a search yields nothing
// ─────────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  const colors = useLibraryColors();
  const s = useStrings().native.bible;
  return (
    <View className="mt-12 items-center" style={{ paddingHorizontal: 22 }}>
      <View className="w-12 h-12 rounded-2xl bg-surface border border-border items-center justify-center mb-4">
        <SearchIcon size={18} stroke={colors.inkSubtle} />
      </View>
      <ThemedText variant="callout" style={{ fontWeight: "700" }}>
        {s.noMatch}
      </ThemedText>
      <ThemedText
        variant="footnote"
        color="muted"
        style={{ marginTop: 6, textAlign: "center" }}
      >
        {query ? fill(s.nothingFor, { q: query }) : s.tryAgain}
      </ThemedText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

function SearchIcon({
  size = 16,
  stroke,
}: {
  size?: number;
  stroke: string;
}) {
  return (
    <SFSymbol
      name="magnifyingglass"
      size={size}
      color={stroke}
      weight="semibold"
    />
  );
}

// ClearIcon — REMOVED. The SearchField above now uses
// React Native's `clearButtonMode="while-editing"` prop, which
// renders UIKit's stock grey-circle X inside the search field
// while the user is typing. Same affordance Apple ships in
// Settings, Mail, Messages — we no longer need to maintain a
// custom SVG clear glyph.
