import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { progressFor } from "@/constants/onboarding";
import { CLOSER_ACCENT, LIGHT_COLORS } from "@/constants/theme";
import { requestNotificationPermission } from "@/lib/notifications";
import { useOnboarding } from "@/state/onboarding";

/**
 * Notifications ask — same iPhone-mock layout as How Closer works:
 * large phone outline (cream fill + bottom fade), headline + body
 * under it, primary CTA.
 */

const PAGE_BG = LIGHT_COLORS.bg;
const PHONE_BORDER = "#111111";
const INK = "#0F0F0F";
const INK_SECONDARY = "#8A8A8E";

export default function NotificationsScreen() {
  const router = useRouter();
  const { height: winH } = useWindowDimensions();
  const { answers, setAnswer } = useOnboarding();
  const [submitting, setSubmitting] = useState(false);

  const firstName = (answers.name || "").trim().split(" ")[0] || "Friend";

  const phoneH = Math.min(500, Math.max(420, Math.round(winH * 0.56)));
  const phoneW = Math.round(phoneH * 0.72);

  const handleTurnOn = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const status = await requestNotificationPermission();
      setAnswer("notificationsEnabled", status === "granted");
    } catch {
      setAnswer("notificationsEnabled", false);
    } finally {
      setSubmitting(false);
      router.push("/onboarding/account");
    }
  };

  const handleSkip = () => {
    setAnswer("notificationsEnabled", false);
    router.push("/onboarding/account");
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: PAGE_BG }]}
      edges={["top", "bottom"]}
    >
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("notifications")}
      />

      <View style={styles.upper}>
        <NotificationPhone
          width={phoneW}
          height={phoneH}
          firstName={firstName}
        />
      </View>

      <View style={styles.lower}>
        <Text style={styles.title}>Enable notifications</Text>
        <Text style={styles.body}>
          One quiet reminder when today's reading is ready — before
          the noise starts.
        </Text>
      </View>

      <View style={styles.spacer} />

      <View style={styles.footer}>
        <Button
          label={submitting ? "Asking…" : "Enable Notifications"}
          onPress={handleTurnOn}
          disabled={submitting}
        />
        {/* Layout on inner View — Pressable function-form drops alignSelf. */}
        <Pressable
          onPress={handleSkip}
          disabled={submitting}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="I'll do this later"
          style={({ pressed }) => ({
            opacity: submitting ? 0.4 : pressed ? 0.55 : 1,
          })}
        >
          <View style={styles.skipWrap}>
            <Text style={styles.skip}>I'll do this later</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function NotificationPhone({
  width,
  height,
  firstName,
}: {
  width: number;
  height: number;
  firstName: string;
}) {
  const fadeH = Math.round(height * 0.16);

  return (
    <View style={{ width, height, alignItems: "center" }}>
      <View
        style={{
          width,
          height,
          borderRadius: 36,
          borderWidth: 2.5,
          borderColor: PHONE_BORDER,
          backgroundColor: PAGE_BG,
          overflow: "hidden",
          paddingTop: Math.round(height * 0.1),
          paddingHorizontal: 16,
        }}
      >
        <Text style={styles.date}>Monday, June 16</Text>
        <Text style={styles.clock}>7:00</Text>

        <View style={styles.notifCard}>
          <View style={styles.notifRow}>
            <View style={styles.appIcon}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 21s-7-4.5-7-11a5 5 0 019-3 5 5 0 019 3c0 6.5-7 11-7 11z"
                  fill="#FFFFFF"
                />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.notifMeta}>
                <Text style={styles.notifApp}>CLOSER</Text>
                <Text style={styles.notifNow}>now</Text>
              </View>
              <Text style={styles.notifTitle}>
                Your word for today is ready.
              </Text>
              <Text style={styles.notifBody} numberOfLines={2}>
                Hi {firstName} — five minutes with God before anything else.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Svg
        pointerEvents="none"
        width={width}
        height={fadeH}
        style={{ position: "absolute", left: 0, bottom: 0 }}
      >
        <Defs>
          <LinearGradient id="notifPhoneFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={PAGE_BG} stopOpacity="0" />
            <Stop offset="40%" stopColor={PAGE_BG} stopOpacity="0.25" />
            <Stop offset="75%" stopColor={PAGE_BG} stopOpacity="0.7" />
            <Stop offset="100%" stopColor={PAGE_BG} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width={width}
          height={fadeH}
          fill="url(#notifPhoneFade)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  upper: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  lower: {
    marginTop: 40,
    paddingHorizontal: 36,
    alignItems: "center",
  },
  title: {
    fontFamily: "System",
    fontWeight: "800",
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.9,
    color: INK,
    textAlign: "center",
  },
  body: {
    marginTop: 12,
    fontFamily: "System",
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 23,
    color: INK_SECONDARY,
    textAlign: "center",
    maxWidth: 300,
  },
  spacer: {
    flex: 1,
    minHeight: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 10,
    alignItems: "stretch",
  },
  skipWrap: {
    marginTop: 12,
    width: "100%",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  skip: {
    fontFamily: "System",
    fontWeight: "500",
    fontSize: 14,
    color: INK_SECONDARY,
    textAlign: "center",
  },
  date: {
    fontFamily: "System",
    fontWeight: "500",
    fontSize: 14,
    color: INK_SECONDARY,
    textAlign: "center",
  },
  clock: {
    fontFamily: "System",
    fontWeight: "400",
    fontSize: 56,
    lineHeight: 62,
    letterSpacing: -1.4,
    color: "rgba(15, 15, 15, 0.45)",
    textAlign: "center",
    marginTop: 2,
  },
  notifCard: {
    marginTop: 22,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  notifRow: {
    flexDirection: "row",
    gap: 10,
  },
  appIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: CLOSER_ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  notifMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notifApp: {
    fontFamily: "System",
    fontWeight: "600",
    fontSize: 11,
    letterSpacing: 0.4,
    color: INK_SECONDARY,
  },
  notifNow: {
    fontFamily: "System",
    fontWeight: "400",
    fontSize: 11,
    color: INK_SECONDARY,
  },
  notifTitle: {
    marginTop: 2,
    fontFamily: "System",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: -0.2,
    color: INK,
  },
  notifBody: {
    marginTop: 2,
    fontFamily: "System",
    fontWeight: "400",
    fontSize: 13,
    lineHeight: 17,
    color: INK_SECONDARY,
  },
});
