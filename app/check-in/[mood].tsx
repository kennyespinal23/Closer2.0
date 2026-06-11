import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { JournalEditor } from "@/components/JournalEditor";
import { findMood, pickVerseForMood, type MoodVerse } from "@/constants/moods";
import { useCheckIns } from "@/state/checkIns";
import { useColors } from "@/state/theme";

/**
 * Step 2 of the check-in: verse delivery.
 *
 * The mood id arrives as a route param. On mount:
 *   1. Resolve the mood from the catalog (or bounce back if missing)
 *   2. Pick a verse from its pool, biased away from recently-seen ones
 *   3. Record the check-in to the persistent log
 *
 * Visuals lean into the mood's accent color:
 *   • Soft radial glow tinted to the mood's swatch
 *   • Big serif-feeling verse text (centered, generous line-height)
 *   • Reference underneath
 *   • Two CTAs: "Open chapter" (jumps into the reader) and "Close"
 *     (back to wherever the user came from)
 *
 * The check-in is silently recorded the moment this screen mounts,
 * so even if the user dismisses without tapping anything, their
 * journey timeline still gets the entry.
 */
export default function VerseDeliveryScreen() {
  const router = useRouter();
  const colors = useColors();
  const { mood: moodParam } = useLocalSearchParams<{ mood?: string }>();
  const { record, updateJournal, recentVerseKeys, log } = useCheckIns();

  // Resolve the mood object. If the param is bogus (deep-link typo,
  // stale build, etc.), bounce back to the mood picker.
  const mood = useMemo(() => findMood(moodParam), [moodParam]);

  // Pick the verse + record the check-in exactly once. The dep
  // array intentionally only includes `mood`: a re-render mustn't
  // pick a new verse / write a second log entry. The check-in's
  // identity is the mount of this screen.
  const verseRef = useRef<MoodVerse | null>(null);
  if (mood && !verseRef.current) {
    verseRef.current = pickVerseForMood(mood, recentVerseKeys(8));
  }

  // Remember which check-in this screen created so we can hang
  // edits (journal text) onto the right record. We can't compute it
  // from `verse + moodId` after the fact because the user could have
  // checked in with the same mood + verse moments earlier.
  const [checkInId, setCheckInId] = useState<string | null>(null);

  useEffect(() => {
    if (mood && verseRef.current && !checkInId) {
      const created = record({ moodId: mood.id, verse: verseRef.current });
      setCheckInId(created.id);
    }
  }, [mood, record, checkInId]);

  // Re-derive the journal text from the persisted log every render
  // so the preview card on this screen always reflects the source
  // of truth (no stale local copy after edits / deletes).
  const journalText = useMemo(() => {
    if (!checkInId) return "";
    const found = log.find((c) => c.id === checkInId);
    return found?.journalText ?? "";
  }, [log, checkInId]);

  const [journalOpen, setJournalOpen] = useState(false);

  const handleSaveJournal = useCallback(
    (text: string) => {
      if (!checkInId) return;
      updateJournal(checkInId, text);
      setJournalOpen(false);
    },
    [checkInId, updateJournal],
  );

  const handleDeleteJournal = useCallback(() => {
    if (!checkInId) return;
    updateJournal(checkInId, "");
    setJournalOpen(false);
  }, [checkInId, updateJournal]);

  const handleShareVerse = useCallback(async () => {
    if (!verseRef.current) return;
    const v = verseRef.current;
    try {
      // System share sheet — works for iMessage, Mail, copy, etc.
      // The message format is intentionally plain so it pastes well
      // anywhere; the reference goes on its own line for readability.
      await Share.share({
        message: `"${v.text}"\n— ${v.reference}`,
      });
    } catch {
      // User cancelled or share unavailable — no-op.
    }
  }, []);

  // Mood-tinted halo behind the verse. Slow fade-in for the calm
  // "the verse is finding you" feeling.
  const haloOpacity = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0.85)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(haloOpacity, {
        toValue: 1,
        duration: 1400,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(haloScale, {
        toValue: 1,
        duration: 1800,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [haloOpacity, haloScale]);

  if (!mood || !verseRef.current) {
    // Fall back silently — no error UI, the user can just re-pick.
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Text
            className="text-ink-muted text-[14px] text-center"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          >
            That mood isn&apos;t in the catalog. Try again.
          </Text>
          <View className="mt-6">
            <Button
              label="Back"
              variant="secondary"
              onPress={() => router.back()}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const verse = verseRef.current;

  const handleOpenChapter = () => {
    // Two-phase nav: dismiss the modal, then push into the reader.
    //
    // Why not do both in the same tick (as we used to)?
    // expo-router's `dismissAll()` and `push()` both schedule
    // navigation-state updates onto the same render. When fired
    // synchronously back-to-back the dismiss tears down the
    // routing context the push needs, and the push is silently
    // dropped — the modal closes and the user lands on whatever
    // tab they came from with no reader screen ever appearing.
    //
    // Deferring the push to the next event-loop tick lets the
    // dismiss settle (the navigation tree re-roots back to the
    // parent stack) before the push tries to add a new route on
    // top. The 0ms timeout is enough — we just need React Native
    // to flush the queued nav action before the next one starts.
    //
    // We pass two query params so the reader can spotlight the
    // verse that was just delivered:
    //   • focus  — verse number to scroll to + glow briefly
    //   • tint   — mood swatch as the glow color, so the
    //              highlight ties visually back to the mood
    // The tint hex is URL-encoded because "#" is otherwise the
    // fragment delimiter.
    const tint = encodeURIComponent(mood.swatch);
    const target =
      `/book/${verse.bookId}/${verse.chapter}?focus=${verse.verse}&tint=${tint}` as const;

    router.dismissAll();
    // Tick-deferred push — see comment above for the race
    // explanation. setTimeout(0) is the right tool here; we
    // don't actually want any visible delay, just an event-loop
    // boundary between the two router calls.
    setTimeout(() => {
      router.push(target as never);
    }, 0);
  };

  const handleClose = () => {
    router.dismissAll();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top bar ─────────────────────────────────────── */}
        <View className="px-6 pt-2 flex-row items-center justify-between">
          <Pressable
            hitSlop={12}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Pick a different mood"
            className="w-9 h-9 rounded-full bg-accent-soft border border-border items-center justify-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
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
            className="text-ink-subtle text-[11px] tracking-[3px] uppercase"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            Check-in
          </Text>
          <View className="w-9 h-9" />
        </View>

        {/* ─── Mood echo ───────────────────────────────────── */}
        <FadeIn delayMs={100} durationMs={900}>
          <View className="px-6 mt-6 items-center">
            {/* Hero: the mood's head illustration. Sits above the
                echo pill so the moment "lands" visually before any
                text arrives. The image is the primary identity. */}
            <Image
              source={mood.image}
              style={{ width: 110, height: 110 }}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <View
              className="flex-row items-center px-3 py-1.5 rounded-full mt-4"
              style={{
                backgroundColor: hexAlpha(mood.swatch, 0.12),
                borderWidth: 1,
                borderColor: hexAlpha(mood.swatch, 0.32),
              }}
            >
              <Text
                className="text-[10.5px] tracking-[2.5px] uppercase"
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: mood.swatch,
                }}
              >
                You said {mood.echo}
              </Text>
            </View>

            <Text
              className="text-ink text-[22px] leading-[28px] tracking-[-0.3px] text-center mt-6 px-4"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              {echoHeadline(mood.echo)}
            </Text>
            <Text
              className="text-ink-muted text-[13.5px] mt-2.5 text-center leading-[20px] px-4"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Here&apos;s a verse for you.
            </Text>
          </View>
        </FadeIn>

        {/* ─── Verse with mood-tinted halo ─────────────────── */}
        <View className="mt-10 mb-2 items-center justify-center">
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: 460,
              height: 460,
              top: -120,
              alignItems: "center",
              justifyContent: "center",
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            }}
          >
            <MoodHalo color={mood.swatch} />
          </Animated.View>

          <FadeIn delayMs={500} durationMs={1300}>
            <View className="px-7 items-center">
              <Text
                className="text-ink text-[22px] leading-[34px] tracking-[-0.2px] text-center"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              >
                &ldquo;{verse.text}&rdquo;
              </Text>
              <View className="flex-row items-center mt-5">
                <View
                  className="w-5 h-[1.5px] rounded-full mr-2.5"
                  style={{ backgroundColor: mood.swatch }}
                />
                <Text
                  className="text-[11px] tracking-[3px] uppercase"
                  style={{
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: mood.swatch,
                  }}
                >
                  {verse.reference}
                </Text>
              </View>
            </View>
          </FadeIn>
        </View>

        {/* ─── Reflection prompt ───────────────────────────────
            Set in UPRIGHT EB Garamond so the reflective line
            shares the same "printed devotional" voice as the
            verse above. Earlier this was Plus Jakarta Sans with
            an `italic` flag; italics in this app are reserved
            for ornamental moments and they fatigue the eye even
            at small sizes. Upright Garamond gives the line the
            literary, contemplative quality the words are asking
            for without the legibility cost. */}
        <FadeIn delayMs={1100} durationMs={1100}>
          <View className="px-8 mt-12">
            <Text
              className="text-ink-muted text-[14.5px] text-center leading-[22px]"
              style={{
                fontFamily: "PlusJakartaSans_500Medium",
                letterSpacing: -0.1,
              }}
            >
              {reflection(mood.echo)}
            </Text>
          </View>
        </FadeIn>

        {/* ─── Saved journal preview ───────────────────────────
            When the user has already written a reflection for
            this check-in, show it inline as a tappable card so it
            doesn't feel buried inside an editor that has to be
            re-opened to see what they wrote. */}
        {journalText.length > 0 && (
          <FadeIn delayMs={200} durationMs={500}>
            <Pressable
              onPress={() => setJournalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Edit your journal entry"
              style={({ pressed }) => ({
                opacity: pressed ? 0.85 : 1,
                borderColor: hexAlpha(mood.swatch, 0.28),
                borderWidth: 1,
              })}
              className="mx-6 mt-8 rounded-2xl bg-surface px-5 py-4"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text
                  className="text-[10px] tracking-[2.5px] uppercase"
                  style={{
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: mood.swatch,
                  }}
                >
                  Your reflection
                </Text>
                <Text
                  className="text-ink-subtle text-[11px]"
                  style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                >
                  Edit
                </Text>
              </View>
              <Text
                className="text-ink text-[14px] leading-[21px]"
                style={{ fontFamily: "PlusJakartaSans_400Regular" }}
                numberOfLines={6}
              >
                {journalText}
              </Text>
            </Pressable>
          </FadeIn>
        )}
      </ScrollView>

      {/* ─── Bottom action stack ────────────────────────────────
          Two rows so the writing/sharing affordances don't have to
          compete with the primary "Open chapter" CTA:
            row 1: Share + Write/Edit  (secondary; mood-tinted)
            row 2: Close + Open chapter (primary CTA pair)        */}
      <FadeIn delayMs={1600} durationMs={900}>
        <View className="px-6 pb-2">
          <View className="flex-row mb-2.5" style={{ gap: 10 }}>
            <View style={{ flex: 1 }}>
              <ChipButton
                label="Share"
                accent={mood.swatch}
                onPress={handleShareVerse}
                icon={<ShareGlyph color={mood.swatch} />}
              />
            </View>
            <View style={{ flex: 1 }}>
              <ChipButton
                label={journalText.length > 0 ? "Edit journal" : "Write"}
                accent={mood.swatch}
                onPress={() => setJournalOpen(true)}
                icon={<PenGlyph color={mood.swatch} />}
              />
            </View>
          </View>

          <View className="flex-row" style={{ gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button
                label="Close"
                variant="secondary"
                onPress={handleClose}
                fullWidth
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
      </FadeIn>

      {/* ─── Journal editor modal ─────────────────────────────── */}
      <JournalEditor
        visible={journalOpen}
        moodLabel={mood.label}
        moodAccent={mood.swatch}
        reference={verse.reference}
        verseText={verse.text}
        initialText={journalText}
        onSave={handleSaveJournal}
        onDelete={handleDeleteJournal}
        onCancel={() => setJournalOpen(false)}
      />
    </SafeAreaView>
  );
}

/**
 * Compact pill-style secondary button used for the Share / Write
 * actions on the verse delivery screen. Picks up the mood's accent
 * so the two rows of CTAs feel cohesive with the verse halo above.
 */
function ChipButton({
  label,
  icon,
  accent,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        opacity: pressed ? 0.75 : 1,
        backgroundColor: hexAlpha(accent, 0.1),
        borderColor: hexAlpha(accent, 0.32),
        borderWidth: 1,
      })}
      className="h-12 rounded-2xl flex-row items-center justify-center px-4"
    >
      {icon}
      <Text
        className="text-[14px] ml-2"
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          color: accent,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ShareGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
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

function PenGlyph({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
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

// ─────────────────────────────────────────────────────────────────
// Copy
// ─────────────────────────────────────────────────────────────────

/**
 * Two-line headline shown above the verse, sentence-cased per mood.
 * Kept short — the verse itself does the heavy lifting.
 */
function echoHeadline(echo: string): string {
  switch (echo) {
    case "anxious":
      return "It's okay to bring the worry.";
    case "sad":
      return "Your sorrow is seen.";
    case "overwhelmed":
      return "He carries what you can't.";
    case "lonely":
      return "You are not as alone as it feels.";
    case "tired":
      return "Come and rest.";
    case "afraid":
      return "He goes ahead of you.";
    case "angry":
      return "Bring it. He can hold it.";
    case "lost":
      return "There is a path. Just one step.";
    case "grateful":
      return "Let the thanks rise.";
    case "hopeful":
      return "Hold onto it.";
    case "peaceful":
      return "Rest here a moment.";
    case "joyful":
      return "Lift it up.";
    default:
      return "Here's a word for you.";
  }
}

function reflection(echo: string): string {
  switch (echo) {
    case "anxious":
      return "Sit with this verse for a breath. What part is for today?";
    case "sad":
      return "Let the verse stay open beside you a while.";
    case "overwhelmed":
      return "One sentence at a time. That's enough for now.";
    case "lonely":
      return "Read it as if it were spoken just to you. It was.";
    case "tired":
      return "Don't try to do anything with this. Just receive it.";
    case "afraid":
      return "Name what you fear and lay it next to this verse.";
    case "angry":
      return "Speak it honestly — He is unbothered by the heat.";
    case "lost":
      return "You don't have to see the whole road tonight.";
    case "grateful":
      return "Say one specific thing out loud. He hears it.";
    case "hopeful":
      return "Hold it loosely. He's the one who keeps it.";
    case "peaceful":
      return "Breathe in, slowly. Stay here as long as you'd like.";
    case "joyful":
      return "Let it spill — joy was never meant to be contained.";
    default:
      return "Take a breath with it.";
  }
}

// ─────────────────────────────────────────────────────────────────
// Visuals
// ─────────────────────────────────────────────────────────────────

/**
 * Wide radial glow tinted to the mood's swatch. Sits behind the
 * verse text and gives the screen a per-mood "color world" without
 * coloring the typography itself.
 */
function MoodHalo({ color }: { color: string }) {
  return (
    <Svg width={460} height={460} viewBox="0 0 460 460">
      <Defs>
        <RadialGradient id="moodHalo" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <Stop offset="50%" stopColor={color} stopOpacity={0.06} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={460} height={460} fill="url(#moodHalo)" />
    </Svg>
  );
}

function hexAlpha(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const hh = Math.round(a * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${hh}`;
}
