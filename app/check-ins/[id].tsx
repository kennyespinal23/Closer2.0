import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, {
  Defs,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { Button } from "@/components/Button";
import { JournalEditor } from "@/components/JournalEditor";
import { findMood } from "@/constants/moods";
import { colors } from "@/constants/theme";
import { useCheckIns } from "@/state/checkIns";

/**
 * Detail page for a single check-in.
 *
 * Reached by tapping a check-in card on the Journey tab. Acts as
 * both the "memory of a moment" (what mood, what verse, when) and
 * the canvas for the user to flesh out that moment further — most
 * naturally by writing or editing a reflection in the journal.
 *
 * Layout, top to bottom:
 *   1. Header — back chevron + "Check-in" title
 *   2. Timestamp eyebrow ("Sat, May 30 · 11:24 AM")
 *   3. Mood pill with the same swatch + glyph that appears on the
 *      verse delivery screen, so the moment reads consistently
 *   4. Mood-tinted halo behind a centered verse + reference
 *   5. Reflection section — either an inline preview of the saved
 *      journal entry (tap to edit) or a soft "Write what's on your
 *      heart" CTA when there's nothing yet
 *   6. Primary actions — Share verse + Open chapter (the chapter
 *      reader will spotlight + glow the delivered verse on arrival)
 *   7. Quiet "Delete check-in" link at the very bottom, mirroring
 *      how NoteEditor and similar surfaces present destructive ops
 *
 * Missing-id state: if the id in the URL no longer maps to a
 * check-in (deleted from elsewhere, stale deep link, etc.) we show
 * an empty-state with a back button instead of crashing.
 */
export default function CheckInDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { findById, updateJournal, remove } = useCheckIns();

  // Re-look-up every render so live edits (journal save, etc.)
  // reflect immediately. Cheap because the log is short.
  const checkIn = useMemo(
    () => (id ? findById(id) : undefined),
    [id, findById],
  );

  // Mood resolution can fail if the catalog dropped a mood between
  // saves; fall back to a neutral accent so the page still renders.
  const mood = useMemo(
    () => (checkIn ? findMood(checkIn.moodId) : null),
    [checkIn],
  );
  const accent = mood?.swatch ?? colors.primary;
  const moodLabel = mood?.label ?? "Check-in";
  const moodGlyph = mood?.glyph ?? "·";

  // ─── Soft halo intro animation ────────────────────────────────
  // Mirrors the verse delivery screen so the visual language is
  // continuous between "you just received this" and "here's that
  // moment, saved."
  const haloOpacity = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(haloOpacity, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(haloScale, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [haloOpacity, haloScale]);

  // ─── Journal editor state ────────────────────────────────────
  const [journalOpen, setJournalOpen] = useState(false);
  const journalText = checkIn?.journalText ?? "";

  const handleSaveJournal = useCallback(
    (text: string) => {
      if (!checkIn) return;
      updateJournal(checkIn.id, text);
      setJournalOpen(false);
    },
    [checkIn, updateJournal],
  );

  const handleDeleteJournal = useCallback(() => {
    if (!checkIn) return;
    updateJournal(checkIn.id, "");
    setJournalOpen(false);
  }, [checkIn, updateJournal]);

  // ─── Actions ─────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (!checkIn) return;
    try {
      await Share.share({
        message: `"${checkIn.verse.text}"\n— ${checkIn.verse.reference}`,
      });
    } catch {
      // Cancel / unavailable — silent.
    }
  }, [checkIn]);

  const handleOpenChapter = useCallback(() => {
    if (!checkIn) return;
    // Same deep-link shape as the verse delivery screen so the
    // reader glows + scrolls to the delivered verse on arrival.
    const tint = encodeURIComponent(accent);
    router.push(
      `/book/${checkIn.verse.bookId}/${checkIn.verse.chapter}?focus=${checkIn.verse.verse}&tint=${tint}` as never,
    );
  }, [checkIn, accent, router]);

  const handleDelete = useCallback(() => {
    if (!checkIn) return;
    Alert.alert(
      "Delete this check-in?",
      "This will remove the mood, the verse it surfaced, and any reflection you wrote — for this moment only.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            remove(checkIn.id);
            // Back out to whatever sent us here (usually Journey).
            router.back();
          },
        },
      ],
    );
  }, [checkIn, remove, router]);

  // ─── Missing / not-found ─────────────────────────────────────
  if (!checkIn) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        <Header onBack={() => router.back()} />
        <View className="flex-1 items-center justify-center px-8">
          <Text
            className="text-ink text-[18px] text-center"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            That check-in isn&apos;t here anymore.
          </Text>
          <Text
            className="text-ink-muted text-[13.5px] text-center mt-2 leading-[20px]"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          >
            It may have been deleted, or this link is from an older
            session.
          </Text>
          <View className="mt-6">
            <Button
              label="Back to Journey"
              variant="secondary"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <Header onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 48, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Timestamp eyebrow ─────────────────────────────── */}
        <View className="items-center px-6 mt-2">
          <Text
            className="text-ink-subtle text-[11px] tracking-[2.5px] uppercase"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            {formatStamp(checkIn.createdAt)}
          </Text>
        </View>

        {/* ─── Mood pill ─────────────────────────────────────── */}
        <View className="items-center mt-4 px-6">
          <View
            className="flex-row items-center px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: hexAlpha(accent, 0.12),
              borderWidth: 1,
              borderColor: hexAlpha(accent, 0.32),
            }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 13,
                color: accent,
              }}
            >
              {moodGlyph}
            </Text>
            <Text
              className="text-[10.5px] tracking-[2.5px] uppercase ml-2"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: accent,
              }}
            >
              You felt {moodLabel.toLowerCase()}
            </Text>
          </View>
        </View>

        {/* ─── Verse with mood halo ──────────────────────────── */}
        <View className="mt-8 mb-2 items-center justify-center">
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: 360,
              height: 360,
              top: -80,
              alignItems: "center",
              justifyContent: "center",
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            }}
          >
            <MoodHalo color={accent} />
          </Animated.View>

          <View className="px-7 items-center">
            <Text
              className="text-ink text-[19px] leading-[30px] tracking-[-0.1px] text-center"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            >
              &ldquo;{checkIn.verse.text}&rdquo;
            </Text>
            <View className="flex-row items-center mt-5">
              <View
                className="w-5 h-[1.5px] rounded-full mr-2.5"
                style={{ backgroundColor: accent }}
              />
              <Text
                className="text-[11px] tracking-[3px] uppercase"
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: accent,
                }}
              >
                {checkIn.verse.reference}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Reflection block ──────────────────────────────── */}
        <View className="mt-10 px-6">
          <Text
            className="text-[10.5px] tracking-[2.5px] uppercase mb-3"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: accent,
            }}
          >
            Reflection
          </Text>

          {journalText.length > 0 ? (
            <Pressable
              onPress={() => setJournalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Edit your reflection"
              style={({ pressed }) => ({
                opacity: pressed ? 0.85 : 1,
                borderColor: hexAlpha(accent, 0.28),
                borderWidth: 1,
              })}
              className="rounded-2xl bg-surface px-5 py-4"
            >
              <Text
                className="text-ink text-[14.5px] leading-[22px]"
                style={{ fontFamily: "PlusJakartaSans_400Regular" }}
              >
                {journalText}
              </Text>
              <View className="flex-row items-center justify-between mt-3 pt-3"
                style={{
                  borderTopWidth: 1,
                  borderTopColor: hexAlpha(accent, 0.14),
                }}
              >
                <Text
                  className="text-ink-subtle text-[11px]"
                  style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                >
                  {checkIn.journalUpdatedAt
                    ? `Updated ${formatStamp(checkIn.journalUpdatedAt)}`
                    : "Tap to edit"}
                </Text>
                <View className="flex-row items-center">
                  <PenGlyph color={accent} />
                  <Text
                    className="text-[11px] ml-1.5"
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      color: accent,
                    }}
                  >
                    Edit
                  </Text>
                </View>
              </View>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setJournalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Write a reflection"
              style={({ pressed }) => ({
                opacity: pressed ? 0.85 : 1,
                borderColor: hexAlpha(accent, 0.32),
                borderWidth: 1,
                borderStyle: "dashed",
              })}
              className="rounded-2xl px-5 py-6 items-center"
            >
              <PenGlyph color={accent} size={18} />
              <Text
                className="text-ink text-[14px] mt-2 text-center"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                Add a reflection
              </Text>
              <Text
                className="text-ink-muted text-[12.5px] mt-1 text-center leading-[18px]"
                style={{ fontFamily: "PlusJakartaSans_400Regular" }}
              >
                Capture what you&apos;re carrying, what stood out, or
                what you want to do with this today.
              </Text>
            </Pressable>
          )}
        </View>

        {/* ─── Primary actions ──────────────────────────────── */}
        <View className="mt-8 px-6">
          <View className="flex-row" style={{ gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button
                label="Share verse"
                variant="secondary"
                onPress={handleShare}
                fullWidth
                leadingIcon={<ShareGlyph color={colors.ink} />}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="Open chapter"
                onPress={handleOpenChapter}
                fullWidth
              />
            </View>
          </View>
        </View>

        {/* ─── Delete — destructive, quiet ──────────────────── */}
        <View className="px-6 mt-10 items-center">
          <Pressable
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete this check-in"
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text
              className="text-[13px]"
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                color: "#FF6B6B",
              }}
            >
              Delete check-in
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <JournalEditor
        visible={journalOpen}
        moodLabel={moodLabel}
        moodAccent={accent}
        reference={checkIn.verse.reference}
        verseText={checkIn.verse.text}
        initialText={journalText}
        onSave={handleSaveJournal}
        onDelete={handleDeleteJournal}
        onCancel={() => setJournalOpen(false)}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-row items-center px-4 pt-2 pb-3">
      <Pressable
        onPress={onBack}
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
        Check-in
      </Text>
      <View className="w-10 h-10" />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Visuals
// ─────────────────────────────────────────────────────────────────

function MoodHalo({ color }: { color: string }) {
  return (
    <Svg width={360} height={360} viewBox="0 0 360 360">
      <Defs>
        <RadialGradient id="detailMoodHalo" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <Stop offset="50%" stopColor={color} stopOpacity={0.05} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={360} height={360} fill="url(#detailMoodHalo)" />
    </Svg>
  );
}

function PenGlyph({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20h4l10-10-4-4L4 16v4z M14 6l4 4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShareGlyph({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v12M12 3l-4 4M12 3l4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * "Sat, May 30 · 11:24 AM" — date + clock in one line. Used both in
 * the page eyebrow and the journal-card "Updated …" subtitle.
 */
function formatStamp(epochMs: number): string {
  const d = new Date(epochMs);
  const date = d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

function hexAlpha(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const hh = Math.round(a * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${hh}`;
}
