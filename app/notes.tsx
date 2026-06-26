import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import {
  formatRef,
  relativeTime,
  routeForVerse,
} from "@/lib/annotationsFormat";
import { typography } from "@/lib/typography";
import { type Note, useAnnotations } from "@/state/annotations";
import { type ColorPalette } from "@/constants/theme";
import { useColors } from "@/state/theme";

/**
 * All notes — the user's running journal of reflections, sorted
 * newest-first. Each card shows the verse reference, a snippet of
 * the verse it's anchored to, the note itself, and a relative
 * timestamp. Tapping a card jumps back to that chapter in the
 * reader.
 */
export default function NotesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { allNotes } = useAnnotations();
  const notes = allNotes();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top", "bottom"]}
    >
      <Header
        title="Notes"
        countLabel={
          notes.length > 0
            ? `${notes.length} ${notes.length === 1 ? "note" : "notes"}`
            : undefined
        }
        colors={colors}
      />

      {notes.length === 0 ? (
        <EmptyState colors={colors} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {notes.map((n) => (
            <NoteCard
              key={n.noteId}
              note={n}
              colors={colors}
              onPress={() => router.push(routeForVerse(n))}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function NoteCard({
  note,
  colors,
  onPress,
}: {
  note: Note;
  colors: ColorPalette;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {({ pressed }) => (
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: 20,
            paddingVertical: 16,
            opacity: pressed ? 0.85 : 1,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "700",
                fontSize: 11,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                color: colors.primary,
              }}
            >
              {formatRef(note)}
            </Text>
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "500",
                fontSize: 11,
                color: colors.inkSubtle,
              }}
            >
              {relativeTime(note.updatedAt)}
            </Text>
          </View>

          {note.verseText ? (
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "400",
                fontSize: 13,
                lineHeight: 19,
                color: colors.inkMuted,
                marginTop: 8,
              }}
              numberOfLines={2}
            >
              &ldquo;{note.verseText}&rdquo;
            </Text>
          ) : null}

          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginVertical: 12,
            }}
          />

          <Text
            style={[typography.body, { color: colors.ink, fontSize: 14.5, lineHeight: 21 }]}
            numberOfLines={6}
          >
            {note.text}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function EmptyState({ colors }: { colors: ColorPalette }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
        style={{
          fontFamily: "System",
          fontWeight: "700",
          fontSize: 18,
          color: colors.ink,
          marginTop: 20,
          textAlign: "center",
        }}
      >
        Nothing written yet
      </Text>
      <Text
        style={{
          fontFamily: "System",
          fontWeight: "400",
          fontSize: 13.5,
          lineHeight: 20,
          color: colors.inkMuted,
          marginTop: 8,
          textAlign: "center",
        }}
      >
        Tap any verse while reading to add a note. Your reflections
        will collect here, in order.
      </Text>
    </View>
  );
}

function Header({
  title,
  countLabel,
  colors,
}: {
  title: string;
  countLabel?: string;
  colors: ColorPalette;
}) {
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
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
        style={{
          flex: 1,
          textAlign: "center",
          fontFamily: "System",
          fontWeight: "700",
          fontSize: 17,
          color: colors.ink,
        }}
      >
        {title}
      </Text>
      {countLabel ? (
        <View
          style={{
            paddingHorizontal: 12,
            height: 40,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "600",
              fontSize: 11,
              color: colors.inkMuted,
            }}
          >
            {countLabel}
          </Text>
        </View>
      ) : (
        <View style={{ width: 40, height: 40 }} />
      )}
    </View>
  );
}
