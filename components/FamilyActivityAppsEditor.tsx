import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceActivitySelectionViewPersisted } from "react-native-device-activity";
import {
  AuthorizationStatus,
  FOCUS_FAMILY_ACTIVITY_SELECTION_ID,
  getScreenTimeSelectionSummary,
  hasScreenTimeAppSelection,
  isNativeScreenTimeAvailable,
  requestScreenTimeAuthorization,
  getScreenTimeAuthorizationStatus,
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
 * The library's invisible 1×1 "sheet anchor" pattern is unreliable
 * inside React Navigation — iOS often never presents the picker. A
 * page-sheet modal with the inline `DeviceActivitySelectionViewPersisted`
 * is the approach Apple documents as the customizable fallback and
 * works consistently on device.
 */
export function FamilyActivityAppsEditor({
  visible,
  onClose,
  onSaved,
}: FamilyActivityAppsEditorProps) {
  const colors = useColors();
  const [modalOpen, setModalOpen] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

  const close = useCallback(() => {
    setModalOpen(false);
    onClose();
  }, [onClose]);

  const finish = useCallback(() => {
    if (hasScreenTimeAppSelection()) {
      onSaved?.();
    }
    close();
  }, [close, onSaved]);

  useEffect(() => {
    if (!visible) {
      setModalOpen(false);
      return;
    }

    if (!isNativeScreenTimeAvailable()) {
      Alert.alert(
        "Screen Time unavailable",
        "Real app blocking requires the Closer TestFlight build with Screen Time enabled.",
      );
      close();
      return;
    }

    let cancelled = false;

    (async () => {
      setAuthorizing(true);
      try {
        const status = getScreenTimeAuthorizationStatus();
        const resolved =
          status === AuthorizationStatus.approved
            ? status
            : await requestScreenTimeAuthorization();

        if (cancelled) return;

        if (resolved !== AuthorizationStatus.approved) {
          Alert.alert(
            "Screen Time permission needed",
            "Closer needs Screen Time access to block apps. You can enable it in Settings → Screen Time.",
          );
          close();
          return;
        }

        setModalOpen(true);
      } catch {
        if (!cancelled) {
          Alert.alert(
            "Couldn't open app picker",
            "Screen Time authorization failed. Try again.",
          );
          close();
        }
      } finally {
        if (!cancelled) setAuthorizing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, close]);

  const summary = getScreenTimeSelectionSummary();
  const selectionCount =
    (summary?.applicationCount ?? 0) +
    (summary?.categoryCount ?? 0) +
    (summary?.webDomainCount ?? 0);

  return (
    <Modal
      visible={visible && modalOpen && !authorizing}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top", "bottom"]}>
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
      </SafeAreaView>
    </Modal>
  );
}
