import { Alert, Linking } from "react-native";
import {
  AuthorizationStatus,
  getScreenTimeAuthorizationStatus,
  isNativeScreenTimeAvailable,
  requestScreenTimeAuthorization,
} from "@/lib/deviceActivityShield";

export type ScreenTimePickerGateResult =
  | { ok: true }
  | { ok: false; reason: "unavailable" | "denied" | "not_approved" };

/**
 * Gate before opening FamilyActivityPicker — authorization must run on
 * the same user gesture as the button that called this function.
 */
export async function ensureScreenTimeReadyForPicker(): Promise<ScreenTimePickerGateResult> {
  if (!isNativeScreenTimeAvailable()) {
    Alert.alert(
      "Screen Time unavailable",
      "Real app blocking requires the Closer TestFlight build with Screen Time enabled.",
    );
    return { ok: false, reason: "unavailable" };
  }

  const current = getScreenTimeAuthorizationStatus();
  const resolved =
    current === AuthorizationStatus.approved
      ? current
      : await requestScreenTimeAuthorization();

  if (resolved === AuthorizationStatus.approved) {
    return { ok: true };
  }

  if (resolved === AuthorizationStatus.denied) {
    Alert.alert(
      "Screen Time is turned off for Closer",
      "Open Settings → Screen Time → Closer and allow Screen Time access, then try again.",
      [
        { text: "Not now", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ],
    );
    return { ok: false, reason: "denied" };
  }

  Alert.alert(
    "Screen Time permission needed",
    "Closer needs Screen Time access to block apps during focus. Tap Allow on the system prompt, then try again.",
  );
  return { ok: false, reason: "not_approved" };
}
