import { Text, View } from "react-native";
import { BOOK } from "@/lib/closer-page/lesson/bookTokens";
import { GENRES, type Book, type Place } from "@/lib/closer-page/lesson/types";
import { nunito } from "./kit";

/* BookSummaryCard, native: the whole book on one card, as it folds up at the end of a Bible Books lesson. */
const at = (b: Book, [ch, v]: Place) => {
  const total = b.chapterLengths.reduce((x, y) => x + y, 0);
  return Math.min(1, (b.chapterLengths.slice(0, ch - 1).reduce((x, y) => x + y, 0) + Math.max(0, v - 1)) / total);
};

export function BookCard({ book }: { book: Book }) {
  const ink = BOOK.ink;
  const label = (s: string) => <Text style={nunito(800, 11, { letterSpacing: 1.6, color: ink, opacity: 0.6, marginTop: 12 })}>{s.toUpperCase()}</Text>;
  return (
    <View style={{ backgroundColor: BOOK.pale, borderRadius: 22, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
      <Text style={nunito(800, 11, { letterSpacing: 1.6, color: ink, opacity: 0.6 })}>BOOK CARD · {GENRES[book.genre].toUpperCase()}</Text>
      <Text style={nunito(900, 34, { color: ink, letterSpacing: -1.2, lineHeight: 36 })}>{book.name}</Text>
      <Text style={nunito(800, 13, { color: ink, opacity: 0.7 })}>{book.title} · {book.chapterLengths.length} {book.chapterWord ?? "chapters"}</Text>
      <Text style={nunito(800, 16, { color: ink, marginTop: 12, lineHeight: 21 })}>{book.summary.overview}</Text>
      {label("Structure")}
      <View style={{ height: 12, borderRadius: 6, overflow: "hidden", backgroundColor: "rgba(35,63,88,.12)", marginTop: 6, flexDirection: "row" }}>
        {book.sections.map((s, k) => {
          const x = at(book, s.from), x2 = at(book, [s.to[0], s.to[1] + 1]);
          const fill = BOOK.sections[k % BOOK.sections.length][0];
          return <View key={s.id} style={{ position: "absolute", top: 0, bottom: 0, left: `${x * 100}%`, width: `${(x2 - x) * 100}%`, backgroundColor: fill === BOOK.pale ? BOOK.primary : fill, borderRightWidth: 2, borderColor: BOOK.pale }} />;
        })}
      </View>
      <View style={{ marginTop: 8, gap: 2 }}>
        {book.sections.map((s, k) => <Text key={s.id} style={nunito(900, 13.5, { color: ink })}>{k + 1}. {s.title} <Text style={nunito(700, 13.5, { opacity: 0.7 })}>· {s.chapters}</Text></Text>)}
      </View>
      {label("Themes")}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
        {book.threads.map(x => <Text key={x.id} style={nunito(800, 12.5, { color: ink, backgroundColor: "rgba(35,63,88,.1)", borderRadius: 99, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 4 })}>{x.title}</Text>)}
      </View>
      {label("Key passages")}
      <Text style={nunito(700, 13.5, { color: ink, marginTop: 4, lineHeight: 20 })}>{book.summary.keys.join("  ·  ")}</Text>
    </View>
  );
}
