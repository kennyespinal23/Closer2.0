import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SFSymbol } from "@/components/Symbol";
import {
  AuthorizationStatus,
  getScreenTimeAuthorizationStatus,
  getScreenTimeSelectionSummary,
  hasScreenTimeAppSelection,
  isNativeScreenTimeAvailable,
  openNativeAppPickerWithAuth,
  waitForScreenTimeAuthorizationResult,
} from "@/lib/deviceActivityShield";
import { useColors } from "@/state/theme";

type ScreenTimePermissionRowProps = {
  onOpenAppPicker?: () => void;
};

/**
 * Settings row for Screen Time authorization + app-selection status.
 * Mirrors the notification-permission row on App Blocks.
 */
export function ScreenTimePermissionRow({
  onOpenAppPicker,
}: ScreenTimePermissionRowProps) {
  const colors = useColors();
  const [busy, setBusy] = useState(false);
  const [authStatus, setAuthStatus] = useState(getScreenTimeAuthorizationStatus);
  const [hasSelection, setHasSelection] = useState(hasScreenTimeAppSelection);

  const refresh = useCallback(() => {
    setAuthStatus(getScreenTimeAuthorizationStatus());
    setHasSelection(hasScreenTimeAppSelection());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestAllowFlow = useCallback(() => {
    if (busy) return;
    setBusy(true);
    openNativeAppPickerWithAuth({
      onAuthorized: () => {
        refresh();
        onOpenAppPicker?.();
        setBusy(false);
      },
    });
    void waitForScreenTimeAuthorizationResult().then(() => {
      refresh();
      setBusy(false);
    });
  }, [busy, onOpenAppPicker, refresh]);

  if (!isNativeScreenTimeAvailable()) {
    return null;
  }

  const authorized = authStatus === AuthorizationStatus.approved;
  const denied = authStatus === AuthorizationStatus.denied;

  let iconBg: string;
  let iconStroke: string;
  let title: string;
  let subtitle: string;
  let ctaLabel: string | null = null;
  let onPress: (() => void) | undefined;

  if (authorized && hasSelection) {
    iconBg = "rgba(34, 197, 94, 0.16)";
    iconStroke = "#22C55E";
    title = "Screen Time enabled";
    subtitle = "Apps you picked will be blocked during focus.";
    ctaLabel = "Update apps";
    onPress = onOpenAppPicker;
  } else if (authorized) {
    iconBg = "rgba(245, 158, 11, 0.16)";
    iconStroke = "#F59E0B";
    title = "Pick apps to block";
    subtitle = "Screen Time is on — choose which apps to quiet.";
    ctaLabel = "Choose apps";
    onPress = onOpenAppPicker;
  } else if (denied) {
    iconBg = "rgba(245, 158, 11, 0.16)";
    iconStroke = "#F59E0B";
    title = "Screen Time blocked";
    subtitle = "Tap Allow — Apple will ask to connect Screen Time.";
    ctaLabel = "Allow";
    onPress = requestAllowFlow;
  } else {
    iconBg = "rgba(255, 255, 255, 0.12)";
    iconStroke = colors.ink as string;
    title = "Allow Screen Time";
    subtitle = "Required to physically block apps during focus.";
    ctaLabel = "Allow";
    onPress = requestAllowFlow;
  }

  const summary = getScreenTimeSelectionSummary();
  if (authorized && summary && hasSelection) {
    const count =
      summary.applicationCount + summary.categoryCount + summary.webDomainCount;
    if (count > 0) {
      subtitle = `${count} ${count === 1 ? "item" : "items"} selected for blocking.`;
    }
  }

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
      <View
        accessibilityRole="summary"
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderRadius: 16,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
          }}
        >
          {authorized && hasSelection ? (
            <SFSymbol
              name="checkmark"
              size={16}
              color={iconStroke}
              weight="semibold"
            />
          ) : (
            <SFSymbol
              name="hourglass"
              size={16}
              color={iconStroke}
              weight="medium"
            />
          )}
        </View>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              color: colors.ink,
              fontSize: 14,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "400",
              color: colors.inkMuted,
              fontSize: 12,
              lineHeight: 17,
              marginTop: 4,
            }}
          >
            {subtitle}
          </Text>
        </View>
        {ctaLabel && onPress ? (
          <Pressable
            onPress={onPress}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
            style={({ pressed }) => ({
              opacity: pressed || busy ? 0.7 : 1,
            })}
          >
            <View
              style={{
                paddingHorizontal: 16,
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
                {ctaLabel}
              </Text>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
