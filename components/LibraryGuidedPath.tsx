import { useMemo } from "react";
import { Alert, Text, View, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";
import { BOOKS, type Book } from "@/constants/books";
import { useProgress } from "@/state/progress";
import { useColors } from "@/state/theme";
import { systemText } from "@/lib/typography";
import { LibraryBook, type LibraryBookFrame } from "./LibraryBookcase";
import { SFSymbol } from "./Symbol";

/** A canonical route through the Bible. Completion follows real chapter progress. */
export function LibraryGuidedPath({ onPick }: { onPick: (book: Book, frame: LibraryBookFrame) => void }) {
  const { width } = useWindowDimensions();
  const colors = useColors();
  const { chaptersRead } = useProgress();
  const completed = useMemo(() => new Set(BOOKS.filter(book => new Set(chaptersRead.filter(c => c.bookId === book.id && c.chapter > 0 && c.chapter <= book.chapters).map(c => c.chapter)).size === book.chapters).map(b => b.id)), [chaptersRead]);
  const next = BOOKS.findIndex(book => !completed.has(book.id));
  const current = next < 0 ? 65 : next;
  const groups = useMemo(() => {
    let order = 0;
    return [...new Set(BOOKS.map(book => book.category))].map(category => {
      const books = BOOKS.filter(book => book.category === category);
      const points = books.map((_, localIndex) => { const i = order++; return { x: width / 2 + Math.min(94, width / 2 - 80) * Math.sin(i * 1.05 + .4), y: 84 + localIndex * 178 }; });
      return { category, books, points };
    });
  }, [width]);
  return <View>
    <View style={{ margin: 24, gap: 12 }}><Text style={[systemText.title2, { color: colors.ink }]}>One book at a time</Text><Text style={[systemText.body, { color: colors.textSecondary }]}>{next < 0 ? "You’ve read all 66 books." : `You’re on ${BOOKS[current].name}, book ${current + 1} of 66.`}</Text><View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 66, now: completed.size }} style={{ height: 6, backgroundColor: colors.border, borderRadius: 3 }}><View style={{ width: `${completed.size / 66 * 100}%`, height: 6, borderRadius: 3, backgroundColor: "#FF7952" }} /></View><Text style={[systemText.footnote, { color: colors.textSecondary }]}>Finish each book’s chapters to move along the path. Browse lets you open any book.</Text></View>
    {groups.map((group, part) => {
      const d = group.points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `C ${group.points[i-1].x} ${p.y-89} ${p.x} ${p.y-89} ${p.x} ${p.y}`).join(" ");
      return <View key={group.category}><View style={{ marginHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderColor: colors.border, gap: 4 }}><Text style={[systemText.caption1, { color: colors.textSecondary }]}>PART {part + 1} · {group.books.length} BOOKS</Text><Text style={[systemText.title2, { color: colors.ink }]}>{group.category}</Text></View><View style={{ height: group.books.length * 178 + 20 }}><Svg pointerEvents="none" width={width} height="100%" style={{ position: "absolute" }}><Path d={d} stroke={colors.border} strokeWidth={4} strokeDasharray="5 9" fill="none" /></Svg>{group.books.map((book, i) => {
        const done = completed.has(book.id), active = book.order - 1 === current, locked = book.order - 1 > current && !done;
        return <View key={book.id} style={{ position: "absolute", left: group.points[i].x - 40, top: group.points[i].y - 57, width: 80, alignItems: "center" }}>
          {active && <Text style={[systemText.caption2, { position: "absolute", top: -24, color: colors.ink, fontWeight: "700" }]}>UP NEXT</Text>}
          <View style={{ opacity: locked ? .48 : 1 }}><LibraryBook book={book} width={80} onPick={(b, frame) => locked ? Alert.alert(`Keep going with ${BOOKS[current].name}`, "This book is further along your guided path. You can open any book in Browse.") : onPick(b, frame)} /></View>
          {(done || locked) && <View pointerEvents="none" style={{ position: "absolute", right: -10, top: 84, width: 28, height: 28, borderRadius: 14, backgroundColor: done ? "#397653" : colors.surface, alignItems: "center", justifyContent: "center" }}><SFSymbol name={done ? "checkmark" : "lock.fill"} size={14} color={done ? "white" : colors.ink} /></View>}
          <Text style={[systemText.footnote, { width: 150, textAlign: "center", marginTop: 10, color: colors.ink }]}>{book.name}</Text>
        </View>;
      })}</View></View>;
    })}
    <Text style={[systemText.title3, { textAlign: "center", color: colors.ink, margin: 24 }]}>That’s the whole story.</Text>
  </View>;
}
