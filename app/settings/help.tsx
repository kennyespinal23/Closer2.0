import { useRef, useState } from "react";
import { Animated, Easing, Linking, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  SettingsLinkRow,
  SettingsScaffold,
  SettingsSection,
} from "@/components/SettingsScaffold";
import { colors } from "@/constants/theme";

const SUPPORT_EMAIL = "hello@closer.app";

const FAQS: { q: string; a: string }[] = [
  {
    q: "How does the daily sermon work?",
    a: "Each morning Closer offers one short sermon — about 5–15 minutes of reading. It rotates through ten formats so the rhythm stays alive: daily teachings, character studies, letters from struggling Christians, prayer nights, and more.",
  },
  {
    q: "Why can I only read today's sermon?",
    a: "Closer is built to slow you down, not to be binged. The day's sermon is the day's sermon. Past sermons live in the Library once you've completed them — you can revisit any that have spoken to you.",
  },
  {
    q: "What if I miss a day?",
    a: "Nothing breaks. There's no shame here. The streak in your Insights tab is for encouragement, never for guilt. You can pick up exactly where you are.",
  },
  {
    q: "Why don't I get a notification?",
    a: "Make sure notifications are enabled in your phone's Settings app, then in Closer under Notifications. If both are on and you're still not seeing them, try toggling Daily Sermon Reminder off and back on.",
  },
  {
    q: "Can I share a sermon with someone?",
    a: "Sharing is coming. For now, the best way is to read together — open the app side-by-side with someone, or tell them what spoke to you.",
  },
];

export default function HelpScreen() {
  return (
    <SettingsScaffold title="Help & Support">
      {/* ─── Hero ────────────────────────────────────────────────
          A small invitation that frames the page — Closer isn't a
          product with a support queue; it's a quiet thing made by
          someone who actually replies. */}
      <View className="px-6 mt-2">
        <View className="rounded-2xl border border-border bg-surface px-5 py-6">
          <Text
            className="text-ink text-[20px] leading-[26px] tracking-[-0.2px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            We&apos;re here, and we read everything.
          </Text>
          <Text
            className="text-ink-muted text-[13.5px] leading-[20px] mt-2.5"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          >
            A real person answers every email. If something is broken,
            unclear, or just isn&apos;t hitting right — tell us.
          </Text>
        </View>
      </View>

      <SettingsSection title="Get in Touch">
        <SettingsLinkRow
          icon={<MailIcon />}
          label="Email Us"
          value={SUPPORT_EMAIL}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          showDivider
        />
        <SettingsLinkRow
          icon={<FeedbackIcon />}
          label="Send Feedback"
          sublabel="Tell us what's working and what isn't"
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Closer feedback`)}
        />
      </SettingsSection>

      <SettingsSection title="Common Questions">
        {FAQS.map((item, i) => (
          <FAQRow
            key={item.q}
            question={item.q}
            answer={item.a}
            showDivider={i < FAQS.length - 1}
          />
        ))}
      </SettingsSection>

      <SettingsSection title="More">
        <SettingsLinkRow
          icon={<BookIcon />}
          label="User Guide"
          sublabel="A quiet walkthrough of every screen"
          onPress={() => {}}
          showDivider
        />
        <SettingsLinkRow
          icon={<CommunityIcon />}
          label="Community"
          sublabel="Meet others on the same rhythm"
          onPress={() => {}}
        />
      </SettingsSection>

      <View className="px-6 mt-8">
        <Text
          className="text-ink-subtle text-[12px] leading-[18px] text-center"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          You showed up today. That counts.
        </Text>
      </View>
    </SettingsScaffold>
  );
}

// ─────────────────────────────────────────────────────────────────
// FAQ row — collapsible, animated expand/collapse
// ─────────────────────────────────────────────────────────────────

function FAQRow({
  question,
  answer,
  showDivider,
}: {
  question: string;
  answer: string;
  showDivider: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Single 0→1 progress drives both rotation and the body's opacity +
  // coarse height. We don't measure the answer's height, so we lean
  // on a max-height interpolation that's generous enough for a few
  // sentences (`400` is the cap). Cleaner than mount/unmount.
  const progress = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    Animated.timing(progress, {
      toValue: next ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      // useNativeDriver disabled because maxHeight isn't compatible
      // with the native driver; the chevron rotate also stays on JS.
      useNativeDriver: false,
    }).start();
  };

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });
  const opacity = progress;
  const maxHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  return (
    <View>
      <Pressable onPress={toggle}>
        <View className="flex-row items-center px-4 py-3.5">
          <Text
            className="text-ink text-[14.5px] flex-1 pr-3"
            style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
          >
            {question}
          </Text>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 6l6 6-6 6"
                stroke={colors.inkSubtle}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
        </View>
      </Pressable>

      <Animated.View style={{ opacity, maxHeight, overflow: "hidden" }}>
        <View className="px-4 pb-4 -mt-1">
          <Text
            className="text-ink-muted text-[13.5px] leading-[20px]"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          >
            {answer}
          </Text>
        </View>
      </Animated.View>

      {showDivider && <View className="h-[1px] bg-border ml-4" />}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

const ICON_PROPS = {
  strokeWidth: 1.7,
  stroke: colors.ink,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function MailIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M3 6h18v12H3z" {...ICON_PROPS} />
      <Path d="M3 7l9 7 9-7" {...ICON_PROPS} />
    </Svg>
  );
}

function FeedbackIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M21 12a8 8 0 11-3.2-6.4L21 4v8z" {...ICON_PROPS} />
    </Svg>
  );
}

function BookIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2zM8 7h6" {...ICON_PROPS} />
    </Svg>
  );
}

function CommunityIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M8 12a3 3 0 100-6 3 3 0 000 6zM16 12a3 3 0 100-6 3 3 0 000 6zM3 20c0-3 2-5 5-5s5 2 5 5M14 20c0-3 1-5 4-5s4 2 4 5" {...ICON_PROPS} />
    </Svg>
  );
}
