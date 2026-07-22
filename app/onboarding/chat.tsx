import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import * as haptics from "@/lib/haptics";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { typography } from "@/lib/typography";
import { useColors } from "@/state/theme";

/** iOS dark Messages — tuned for Closer's black canvas. */
const IOS_DARK = {
  incomingBubble: "#262628",
  /** Real iMessage outgoing blue (sent bubbles). */
  outgoingBubble: "#007AFF",
  outgoingInk: "#FFFFFF",
  chevron: "#0A84FF",
  online: "#32D74B",
} as const;

const SCRIPT = [
  "hey",
  "does this sound familiar?",
  "you scroll",
  "feel guilty after",
  "tell yourself you'll stop",
  "scroll more",
  "feel even more guilty",
  "repeat.",
] as const;

const ANSWERS = [
  { id: "yes", label: "yeah that's me" },
  { id: "callout", label: "stop calling me out" },
  { id: "bad", label: "is this bad?" },
] as const;

const TYPING_MS = 1000;
const PAUSE_MS = 920;
const ANSWER_PAUSE_MS = 720;

function TypingBubble({ bubbleBg, dotColor }: { bubbleBg: string; dotColor: string }) {
  const dots = useRef([
    new Animated.Value(0.35),
    new Animated.Value(0.35),
    new Animated.Value(0.35),
  ]).current;

  useEffect(() => {
    const loops = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(dot, {
            toValue: 1,
            duration: 360,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.35,
            duration: 360,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [dots]);

  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: bubbleBg,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: "row",
        gap: 5,
        marginBottom: 8,
      }}
    >
      {dots.map((opacity, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: dotColor,
            opacity,
          }}
        />
      ))}
    </View>
  );
}

function IncomingBubble({
  text,
  bubbleBg,
  ink,
}: {
  text: string;
  bubbleBg: string;
  ink: string;
}) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        maxWidth: "82%",
        backgroundColor: bubbleBg,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 8,
      }}
    >
      <Text
        style={[
          typography.body,
          {
            color: ink,
            fontSize: 17,
            lineHeight: 22,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function OutgoingBubble({
  label,
  onPress,
  bubbleBg,
  ink,
}: {
  label: string;
  onPress?: () => void;
  bubbleBg: string;
  ink: string;
}) {
  const body = (
    <View
      style={{
        alignSelf: "flex-end",
        maxWidth: "78%",
        backgroundColor: bubbleBg,
        borderRadius: 18,
        borderBottomRightRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          fontFamily: typography.body.fontFamily,
          fontWeight: "400",
          fontSize: 17,
          lineHeight: 22,
          color: ink,
        }}
      >
        {label}
      </Text>
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
      accessibilityRole="button"
    >
      {body}
    </Pressable>
  );
}

/**
 * Onboarding — iMessage-style chat beat (Brain / Me+ pattern).
 * Script plays in gray bubbles; user picks a reply at the end.
 */
export default function OnboardingChatScreen() {
  const router = useRouter();
  const colors = useColors();
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<ScrollView>(null);

  const [visibleMessages, setVisibleMessages] = useState<string[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [showAnswerPrompt, setShowAnswerPrompt] = useState(false);
  const [visibleAnswerCount, setVisibleAnswerCount] = useState(0);
  const [done, setDone] = useState(false);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: !reducedMotion });
    });
  }, [reducedMotion]);

  useEffect(() => {
    let cancelled = false;
    const typingMs = reducedMotion ? 0 : TYPING_MS;
    const pauseMs = reducedMotion ? 200 : PAUSE_MS;
    const answerPauseMs = reducedMotion ? 160 : ANSWER_PAUSE_MS;

    const run = async () => {
      for (const line of SCRIPT) {
        if (cancelled) return;
        if (!reducedMotion) {
          setShowTyping(true);
          scrollToEnd();
          await new Promise((r) => setTimeout(r, typingMs));
        }
        if (cancelled) return;
        setShowTyping(false);
        setVisibleMessages((prev) => [...prev, line]);
        scrollToEnd();
        await new Promise((r) => setTimeout(r, pauseMs));
      }
      if (cancelled) return;

      await new Promise((r) => setTimeout(r, answerPauseMs));
      if (cancelled) return;
      setShowAnswerPrompt(true);
      scrollToEnd();

      for (let i = 0; i < ANSWERS.length; i++) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, answerPauseMs));
        if (cancelled) return;
        setVisibleAnswerCount(i + 1);
        scrollToEnd();
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [reducedMotion, scrollToEnd]);

  const pickAnswer = () => {
    if (done) return;
    setDone(true);
    haptics.tap();
    router.replace("/onboarding/protected");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 8,
            paddingBottom: 10,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{ padding: 8 }}
          >
            <Svg width={12} height={20} viewBox="0 0 12 20" fill="none">
              <Path
                d="M10 2L2 10l8 8"
                stroke={IOS_DARK.chevron}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>

          <Image
            source={require("@/assets/icon.png")}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              marginLeft: 4,
            }}
            accessibilityIgnoresInvertColors
          />

          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text
              style={{
                fontFamily: typography.body.fontFamily,
                fontWeight: "600",
                fontSize: 17,
                color: colors.ink,
              }}
            >
              Closer
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: IOS_DARK.online,
                  marginRight: 5,
                }}
              />
              <Text style={{ fontSize: 13, color: colors.inkSecondary }}>
                Online
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, backgroundColor: colors.bg }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToEnd}
        >
          {visibleMessages.map((line, i) => (
            <IncomingBubble
              key={`${line}-${i}`}
              text={line}
              bubbleBg={IOS_DARK.incomingBubble}
              ink={colors.ink}
            />
          ))}
          {showTyping ? (
            <TypingBubble
              bubbleBg={IOS_DARK.incomingBubble}
              dotColor={colors.inkSecondary}
            />
          ) : null}

          {showAnswerPrompt ? (
            <View style={{ marginTop: 12 }}>
              <Text
                style={{
                  alignSelf: "flex-end",
                  fontSize: 13,
                  color: colors.inkMuted,
                  marginBottom: 10,
                  marginRight: 4,
                }}
              >
                Tap to choose a reply
              </Text>
              {ANSWERS.slice(0, visibleAnswerCount).map((answer) => (
                <OutgoingBubble
                  key={answer.id}
                  label={answer.label}
                  onPress={pickAnswer}
                  bubbleBg={IOS_DARK.outgoingBubble}
                  ink={IOS_DARK.outgoingInk}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
