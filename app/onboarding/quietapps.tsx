import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FamilyActivityAppsEditor } from "@/components/FamilyActivityAppsEditor";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { ShieldScreen } from "@/components/ShieldScreen";
import { SFSymbol } from "@/components/Symbol";
import { progressFor } from "@/constants/onboarding";
import { CLOSER_ACCENT } from "@/constants/theme";
import * as haptics from "@/lib/haptics";
import {
  applyScreenTimeConfiguration,
  AuthorizationStatus,
  configureCloserShieldUI,
  formatScreenTimeSelectionSummary,
  getScreenTimeAuthorizationStatus,
  getScreenTimeSelectionSummary,
  hasScreenTimeAppSelection,
  isNativeScreenTimeAvailable,
  openNativeAppPickerWithAuth,
  primeScreenTimeAuthorizationFromGesture,
  waitForScreenTimeAuthorizationResult,
} from "@/lib/deviceActivityShield";
import { findSocialApp } from "@/lib/focus";
import { syncAllScheduledAppBlocks } from "@/lib/scheduledAppBlocks";
import { useFocus } from "@/state/focus";
import { useOnboarding } from "@/state/onboarding";
import { useStudySessions } from "@/state/studySessions";
import { useColors } from "@/state/theme";

/**
 * Screen — Quiet the apps on your phone.
 *
 * The real Screen Time setup beat. After the user has picked sermon
 * and study times, we ask Apple which apps/categories to block —
 * social, games, whatever is actually installed — then preview
 * what the OS shield looks like when they try to open one.
 *
 * On builds without the native module (Expo Go / simulator without
 * extensions), we explain honor mode and let them continue.
 */
export default function QuietAppsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { answers, setAnswer } = useOnboarding();
  const { setEnabled } = useFocus();
  const { sessions } = useStudySessions();

  const nativeShield = isNativeScreenTimeAvailable();
  const firstName = (answers.name || "").trim().split(" ")[0];

  const [authStatus, setAuthStatus] = useState(getScreenTimeAuthorizationStatus);
  const [hasSelection, setHasSelection] = useState(hasScreenTimeAppSelection);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const previewAppId = useMemo(() => {
    const morning = answers.morningApps ?? [];
    const branded = morning.find((id) => findSocialApp(id));
    return branded ?? "instagram";
  }, [answers.morningApps]);

  const selectionSummary = getScreenTimeSelectionSummary();

  const refresh = useCallback(() => {
    setAuthStatus(getScreenTimeAuthorizationStatus());
    setHasSelection(hasScreenTimeAppSelection());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, pickerOpen, previewOpen]);

  const authorized = authStatus === AuthorizationStatus.approved;

  const openPickerWithAuth = useCallback(() => {
    if (busy) return;
    setBusy(true);
    openNativeAppPickerWithAuth({
      onAuthorized: () => {
        setPickerOpen(true);
        setBusy(false);
      },
    });
    void waitForScreenTimeAuthorizationResult().then(() => {
      refresh();
      setBusy(false);
    });
  }, [busy, refresh]);

  const handlePickerSaved = () => {
    refresh();
    applyScreenTimeConfiguration();
    setEnabled(true);
    setAnswer("screenTimeConfigured", true);
    void syncAllScheduledAppBlocks(sessions).catch(() => {});
    haptics.success();
  };

  const handleContinue = () => {
    if (nativeShield && authorized && hasSelection) {
      configureCloserShieldUI();
      setEnabled(true);
      setAnswer("screenTimeConfigured", true);
    }
    router.push("/onboarding/paywall");
  };

  const handleSkip = () => {
    setAnswer("screenTimeConfigured", false);
    router.push("/onboarding/paywall");
  };

  const canContinue =
    !nativeShield || (authorized && hasSelection);

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("quietapps")}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          <FadeIn delayMs={0}>
            <Text
              className="text-ink mt-2"
              style={{
                fontFamily: "System",
                fontWeight: "700",
                fontSize: 28,
                lineHeight: 36,
                letterSpacing: -0.4,
              }}
            >
              {firstName
                ? `${firstName}, which apps should be quiet?`
                : "Which apps should be quiet?"}
            </Text>
          </FadeIn>

          <FadeIn delayMs={400}>
            <Text
              className="text-ink-muted mt-3"
              style={{
                fontFamily: "System",
                fontWeight: "400",
                fontSize: 15,
                lineHeight: 22,
              }}
            >
              Pick from what's actually on your phone — social, games,
              anything that pulls you away. Closer blocks them during
              your study time and focus sessions.
            </Text>
          </FadeIn>

          {nativeShield ? (
            <>
              <FadeIn delayMs={700}>
                <StatusCard
                  icon={hasSelection ? "apps.ipad" : "plus.circle.fill"}
                  iconColor={CLOSER_ACCENT}
                  title={
                    hasSelection
                      ? formatScreenTimeSelectionSummary(selectionSummary)
                      : "Choose apps from your phone"
                  }
                  subtitle={
                    hasSelection
                      ? "Tap to update your list anytime."
                      : authorized
                        ? "Opens Apple's picker — social, games, categories, and more."
                        : "Apple will ask to connect Screen Time, then you pick apps."
                  }
                  cta={hasSelection ? "Update" : "Choose apps"}
                  onPressIn={() => primeScreenTimeAuthorizationFromGesture()}
                  onCta={openPickerWithAuth}
                  busy={busy}
                />
              </FadeIn>

              {hasSelection ? (
                <FadeIn delayMs={1100}>
                  <Pressable
                    onPress={() => {
                      haptics.soft();
                      setPreviewOpen(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Preview blocking screen"
                    style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                  >
                    <View
                      style={{
                        marginTop: 16,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        padding: 16,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: "rgba(0,0,0,0.85)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 14,
                        }}
                      >
                        <SFSymbol
                          name="lock.shield.fill"
                          size={18}
                          color="#FFFFFF"
                          weight="semibold"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: "System",
                            fontWeight: "700",
                            fontSize: 14,
                            color: colors.ink,
                          }}
                        >
                          Preview blocking screen
                        </Text>
                        <Text
                          style={{
                            fontFamily: "System",
                            fontWeight: "400",
                            fontSize: 12,
                            lineHeight: 17,
                            color: colors.inkMuted,
                            marginTop: 2,
                          }}
                        >
                          See what appears when you open a blocked app.
                        </Text>
                      </View>
                      <SFSymbol
                        name="chevron.right"
                        size={12}
                        color={colors.inkMuted}
                        weight="semibold"
                      />
                    </View>
                  </Pressable>
                </FadeIn>
              ) : null}
            </>
          ) : (
            <FadeIn delayMs={700}>
              <View
                style={{
                  marginTop: 20,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: "System",
                    fontWeight: "600",
                    fontSize: 14,
                    color: colors.ink,
                  }}
                >
                  Install the TestFlight build to enable real blocking
                </Text>
                <Text
                  style={{
                    fontFamily: "System",
                    fontWeight: "400",
                    fontSize: 13,
                    lineHeight: 18,
                    color: colors.inkMuted,
                    marginTop: 6,
                  }}
                >
                  This preview build can't access Screen Time. On your
                  phone with build #14+, you'll pick apps from Apple's
                  list here.
                </Text>
              </View>
            </FadeIn>
          )}
        </View>
      </ScrollView>

      <View className="px-6 pb-2">
        <Button
          label={canContinue ? "Continue" : "Choose apps to continue"}
          onPress={canContinue ? handleContinue : openPickerWithAuth}
          loading={busy}
          disabled={busy}
        />
        {nativeShield && !canContinue ? (
          <Pressable
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel="Set up later"
            className="py-3 items-center mt-1"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "600",
                fontSize: 13,
                color: colors.inkMuted,
              }}
            >
              Set up later
            </Text>
          </Pressable>
        ) : null}
      </View>

      <FamilyActivityAppsEditor
        visible={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          refresh();
        }}
        onSaved={handlePickerSaved}
      />

      <Modal
        visible={previewOpen}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setPreviewOpen(false)}
      >
        <ShieldScreen
          appId={previewAppId}
          variant="device"
          primaryLabel="Got it"
          onPrimaryPress={() => setPreviewOpen(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

function StatusCard({
  icon,
  iconColor,
  title,
  subtitle,
  cta,
  onCta,
  onPressIn,
  busy,
}: {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  cta?: string;
  onCta?: () => void;
  onPressIn?: () => void;
  busy?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        marginTop: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: "rgba(128,128,128,0.12)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        <SFSymbol
          name={icon as "checkmark.circle.fill"}
          size={18}
          color={iconColor}
          weight="semibold"
        />
      </View>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "700",
            fontSize: 14,
            color: colors.ink,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "400",
            fontSize: 12,
            lineHeight: 17,
            color: colors.inkMuted,
            marginTop: 4,
          }}
        >
          {subtitle}
        </Text>
      </View>
      {cta && onCta ? (
        <Pressable
          onPressIn={onPressIn}
          onPress={onCta}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={cta}
          style={({ pressed }) => ({
            opacity: pressed || busy ? 0.7 : 1,
          })}
        >
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: colors.ink,
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "700",
                fontSize: 12,
                color: colors.primaryFg,
              }}
            >
              {cta}
            </Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
