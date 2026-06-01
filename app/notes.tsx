import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import {
  formatRef,
  relativeTime,
  routeForVerse,
} from "@/lib/annotationsFormat";
import { type Note, useAnnotations } from "@/state/annotations";
import { useColors } from "@/state/theme";

/**
 * All notes — the user's running journal of reflections, sorted
 * newest-first. Each card shows the verse reference, a snippet of
 * the verse it's anchored to, the note itself, and a relative
 * timestamp. Tapping a card jumps back to that chapter in the
 * reader.
 *
 * Empty state matters here: this screen exists from day one but
 * stays empty until the user writes their first note, so the empty
 * copy needs to feel like an invitation, not an apology.
 */
export default function NotesScreen() {
  const router = useRouter();
  const { allNotes } = useAnnotations();
  const notes = allNotes();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <Header
        title="Notes"
        countLabel={
          notes.length > 0
            ? `${notes.length} ${notes.length === 1 ? "note" : "notes"}`
            : undefined
        }
      />

      {notes.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {notes.map((n) => (
            <NoteCard
              // noteId is unique per entry, while `key` (the verseKey)
              // can repeat when a verse has more than one note.
              key={n.noteId}
              note={n}
              onPress={() => router.push(routeForVerse(n))}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────

function NoteCard({ note, onPress }: { note: Note; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      className="mx-5 mt-3 rounded-2xl border border-border bg-surface px-5 py-4"
    >
      <View className="flex-row items-baseline justify-between">
        <Text
          className="text-primary text-[10.5px] tracking-[2.5px] uppercase"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {formatRef(note)}
        </Text>
        <Text
          className="text-ink-subtle text-[11px]"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
        >
          {relativeTime(note.updatedAt)}
        </Text>
      </View>

      {note.verseText ? (
        <Text
          className="text-ink-muted text-[13px] mt-2 leading-[19px]"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          numberOfLines={2}
        >
          &ldquo;{note.verseText}&rdquo;
        </Text>
      ) : null}

      {/* Quiet divider — the note itself gets its own visual block
          below the verse so it reads as a separate column of thought. */}
      <View className="h-[1px] bg-border my-3" />

      <Text
        className="text-ink text-[14.5px] leading-[21px]"
        style={{ fontFamily: "PlusJakartaSans_500Medium" }}
        numberOfLines={6}
      >
        {note.text}
      </Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────

function EmptyState() {
  const colors = useColors();
  return (
    <View className="flex-1 items-center justify-center px-10">
      <View className="w-14 h-14 rounded-2xl bg-accent-soft border border-border items-center justify-center">
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 4h12l4 4v12H4zM14 4v6h6"
            stroke={colors.ink}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <Path
            d="M8 14h8M8 18h6"
            stroke={colors.ink}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </Svg>
      </View>
      <Text
        className="text-ink text-[18px] mt-5 text-center"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        Nothing written yet
      </Text>
      <Text
        className="text-ink-muted text-[13.5px] mt-2 text-center leading-[20px]"
        style={{ fontFamily: "PlusJakartaSans_400Regular" }}
      >
        Tap any verse while reading to add a note. Your reflections
        will collect here, in order.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Header (shared shape with /highlights — kept inline because each
// screen owns its own back-action semantics; abstracting felt thin.)
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
    <View className="flex-row items-center px-4 pt-2 pb-3">
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
        className="w-10 h-10 rounded-full items-center justify-center"
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
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        {title}
      </Text>
      {countLabel ? (
        <View className="px-3 h-10 rounded-full border border-border items-center justify-center">
          <Text
            className="text-ink-muted text-[11px]"
            style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
          >
            {countLabel}
          </Text>
        </View>
      ) : (
        <View className="w-10 h-10" />
      )}
    </View>
  );
}
