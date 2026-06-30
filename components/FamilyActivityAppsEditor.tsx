import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceActivitySelectionViewPersisted } from "react-native-device-activity";
import { SFSymbol } from "@/components/Symbol";
import { CLOSER_ACCENT } from "@/constants/theme";
import {
  AuthorizationStatus,
  FOCUS_FAMILY_ACTIVITY_SELECTION_ID,
  getScreenTimeAuthorizationStatus,
  getScreenTimeSelectionSummary,
  hasScreenTimeAppSelection,
  isNativeScreenTimeAvailable,
  requestScreenTimeAuthorization,
  type AuthorizationStatusType,
} from "@/lib/deviceActivityShield";
import { typography } from "@/lib/typography";
import { useColors } from "@/state/theme";

export type FamilyActivityAppsEditorProps = {
  visible: boolean;
  onClose: () => void;
  /** Fired after the user saves a selection in the native sheet. */
  onSaved?: () => void;
};

/**
 * Presents Apple's FamilyActivityPicker in a full-screen modal.
 *
 * When Screen Time isn't approved yet, shows an in-modal Allow step
 * so `requestAuthorization` runs on a direct button tap (iOS requires
 * this — async pre-gates before opening the modal never show the sheet).
 */
export function FamilyActivityAppsEditor({
  visible,
  onClose,
  onSaved,
}: FamilyActivityAppsEditorProps) {
  const colors = useColors();
  const [authStatus, setAuthStatus] = useState<AuthorizationStatusType>(
    getScreenTimeAuthorizationStatus,
  );
  const [requesting, setRequesting] = useState(false);

  const authorized = authStatus === AuthorizationStatus.approved;

  const close = useCallback(() => {
    setRequesting(false);
    onClose();
  }, [onClose]);

  const finish = useCallback(() => {
    if (hasScreenTimeAppSelection()) {
      onSaved?.();
    }
    close();
  }, [close, onSaved]);

  useEffect(() => {
    if (visible) {
      setAuthStatus(getScreenTimeAuthorizationStatus());
    }
  }, [visible]);

  const handleAllowPress = useCallback(() => {
    if (requesting) return;

    if (!isNativeScreenTimeAvailable()) {
      Alert.alert(
        "Screen Time unavailable",
        "Real app blocking requires the Closer TestFlight build with Screen Time enabled.",
      );
      close();
      return;
    }

    if (authStatus === AuthorizationStatus.denied) {
      void Linking.openSettings();
      return;
    }

    setRequesting(true);
    void requestScreenTimeAuthorization().then((next) => {
      setAuthStatus(next);
      setRequesting(false);

      if (next === AuthorizationStatus.denied) {
        Alert.alert(
          "Screen Time was denied",
          "You can enable it later in Settings → Screen Time → Closer.",
          [
            { text: "OK", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
      }
    });
  }, [authStatus, close, requesting]);

  const summary = getScreenTimeSelectionSummary();
  const selectionCount =
    (summary?.applicationCount ?? 0) +
    (summary?.categoryCount ?? 0) +
    (summary?.webDomainCount ?? 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top", "bottom"]}>
        {!authorized ? (
          <ScreenTimeAuthGate
            colors={colors}
            authStatus={authStatus}
            requesting={requesting}
            onCancel={close}
            onAllow={handleAllowPress}
          />
        ) : (
          <>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Pressable
                onPress={close}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Text style={[typography.body, { color: colors.inkMuted, fontSize: 15 }]}>
                  Cancel
                </Text>
              </Pressable>

              <Text
                style={[
                  typography.body,
                  { fontWeight: "700", fontSize: 17, color: colors.ink },
                ]}
              >
                Choose apps
              </Text>

              <Pressable
                onPress={finish}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Done"
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Text
                  style={[
                    typography.body,
                    {
                      fontWeight: "700",
                      fontSize: 15,
                      color: selectionCount > 0 ? colors.select : colors.inkMuted,
                    },
                  ]}
                >
                  Done
                </Text>
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
              <Text style={[typography.body, { color: colors.inkMuted, fontSize: 14 }]}>
                Select apps, categories, or websites to quiet during focus
                sessions and scheduled blocks.
              </Text>
            </View>

            <View style={{ flex: 1, minHeight: 320 }}>
              <DeviceActivitySelectionViewPersisted
                style={{ flex: 1, width: "100%" }}
                familyActivitySelectionId={FOCUS_FAMILY_ACTIVITY_SELECTION_ID}
                headerText="Apps to quiet"
                footerText="Categories like Social or Games block every app in that group."
                includeEntireCategory
                onSelectionChange={() => {
                  /* Persisted variant writes selection natively by id. */
                }}
              />
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function ScreenTimeAuthGate({
  colors,
  authStatus,
  requesting,
  onCancel,
  onAllow,
}: {
  colors: ReturnType<typeof useColors>;
  authStatus: AuthorizationStatusType;
  requesting: boolean;
  onCancel: () => void;
  onAllow: () => void;
}) {
  const denied = authStatus === AuthorizationStatus.denied;

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Pressable
          onPress={onCancel}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={[typography.body, { color: colors.inkMuted, fontSize: 15 }]}>
            Cancel
          </Text>
        </Pressable>
        <View style={{ width: 44 }} />
      </View>

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            backgroundColor: "rgba(255, 122, 0, 0.14)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <SFSymbol
            name="hourglass"
            size={32}
            color={CLOSER_ACCENT}
            weight="semibold"
          />
        </View>

        <Text
          style={[
            typography.devotionalTitle,
            { color: colors.ink, textAlign: "center", fontSize: 24, lineHeight: 30 },
          ]}
        >
          Allow Screen Time
        </Text>

        <Text
          style={[
            typography.body,
            {
              color: colors.inkMuted,
              textAlign: "center",
              marginTop: 12,
            },
          ]}
        >
          {denied
            ? "Closer needs Screen Time access to block apps. Turn it on in Settings, then tap below to continue."
            : "Apple will ask to connect Screen Time so Closer can quiet the apps you pick during focus and scheduled blocks."}
        </Text>

        <Pressable
          onPress={onAllow}
          disabled={requesting}
          accessibilityRole="button"
          accessibilityLabel={denied ? "Open Settings" : "Allow Screen Time"}
          style={({ pressed }) => ({
            marginTop: 32,
            width: "100%",
            opacity: pressed || requesting ? 0.85 : 1,
          })}
        >
          <View
            style={{
              backgroundColor: CLOSER_ACCENT,
              borderRadius: 999,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              minHeight: 52,
            }}
          >
            {requesting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[typography.button, { color: "#FFFFFF" }]}>
                {denied ? "Open Settings" : "Continue"}
              </Text>
            )}
          </View>
        </Pressable>

        {!denied ? (
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "400",
              fontSize: 13,
              lineHeight: 18,
              color: colors.inkSubtle,
              textAlign: "center",
              marginTop: 16,
            }}
          >
            Tap Continue — Apple&apos;s permission sheet appears next.
          </Text>
        ) : null}
      </View>
    </View>
  );
}
