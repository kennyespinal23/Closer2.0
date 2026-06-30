/**
 * iOS Screen Time / Family Controls integration for Closer focus mode.
 *
 * Wraps `react-native-device-activity` with Closer-specific IDs and
 * shield copy. When the native module isn't in the build (Expo Go,
 * TestFlight builds with INCLUDE_DEVICE_ACTIVITY=false), every call
 * here is a safe no-op.
 */

import { Platform } from "react-native";
import {
  AuthorizationStatus,
  activitySelectionMetadata,
  blockSelection,
  getAuthorizationStatus,
  getFamilyActivitySelectionId,
  isAvailable,
  isShieldActive,
  onAuthorizationStatusChange,
  pollAuthorizationStatus,
  requestAuthorization,
  resetBlocks,
  unblockSelection,
  updateShield,
  type AuthorizationStatusType,
} from "react-native-device-activity";
import {
  NATIVE_SHIELD_PRIMARY_LABEL,
  NATIVE_SHIELD_SUBTITLE,
  NATIVE_SHIELD_TITLE,
} from "@/lib/shieldCopy";

export { AuthorizationStatus, type AuthorizationStatusType };

/** Persisted FamilyActivitySelection id — shared by picker + shield. */
export const FOCUS_FAMILY_ACTIVITY_SELECTION_ID = "closer-focus-selection";

export function isNativeScreenTimeAvailable(): boolean {
  return Platform.OS === "ios" && isAvailable();
}

export function getScreenTimeAuthorizationStatus(): AuthorizationStatusType {
  if (!isNativeScreenTimeAvailable()) {
    return AuthorizationStatus.notDetermined;
  }
  return getAuthorizationStatus();
}

export function isScreenTimeAuthorized(): boolean {
  return (
    getScreenTimeAuthorizationStatus() === AuthorizationStatus.approved
  );
}

/**
 * Request Screen Time authorization. Call from a direct `onPress`
 * handler (the in-modal Allow button). iOS only shows the system
 * sheet when the native call is tied to an active user gesture.
 *
 * Never throws; returns the resolved status after the system dialog.
 */
export async function requestScreenTimeAuthorization(): Promise<AuthorizationStatusType> {
  if (!isNativeScreenTimeAvailable()) {
    return AuthorizationStatus.notDetermined;
  }

  const existing = getScreenTimeAuthorizationStatus();
  if (existing === AuthorizationStatus.approved) {
    return AuthorizationStatus.approved;
  }

  let subscription: ReturnType<typeof onAuthorizationStatusChange> | undefined;
  const statusFromEvent = new Promise<AuthorizationStatusType>((resolve) => {
    const timeout = setTimeout(() => {
      resolve(getAuthorizationStatus());
    }, 120_000);

    subscription = onAuthorizationStatusChange((event) => {
      if (event.authorizationStatus !== AuthorizationStatus.notDetermined) {
        clearTimeout(timeout);
        resolve(event.authorizationStatus);
      }
    });
  });

  try {
    await requestAuthorization("individual");
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[screen-time] requestAuthorization failed", error);
    }
    subscription?.remove();
    return getScreenTimeAuthorizationStatus();
  }

  const resolved = await Promise.race([
    statusFromEvent,
    pollAuthorizationStatus({
      maxAttempts: 60,
      pollIntervalMs: 500,
    }),
  ]);

  subscription?.remove();
  return resolved;
}

/** Count of native picker items (apps + categories + sites). */
export function countScreenTimeSelectionItems(): number {
  const summary = getScreenTimeSelectionSummary();
  if (!summary) return 0;
  return (
    summary.applicationCount +
    summary.categoryCount +
    summary.webDomainCount
  );
}

export function hasScreenTimeAppSelection(): boolean {
  if (!isNativeScreenTimeAvailable()) return false;
  const token = getFamilyActivitySelectionId(FOCUS_FAMILY_ACTIVITY_SELECTION_ID);
  return typeof token === "string" && token.length > 0;
}

export type ScreenTimeSelectionSummary = {
  applicationCount: number;
  categoryCount: number;
  webDomainCount: number;
};

export function getScreenTimeSelectionSummary(): ScreenTimeSelectionSummary | null {
  if (!hasScreenTimeAppSelection()) return null;
  const meta = activitySelectionMetadata({
    activitySelectionId: FOCUS_FAMILY_ACTIVITY_SELECTION_ID,
  });
  if (!meta) return null;
  return {
    applicationCount: meta.applicationCount,
    categoryCount: meta.categoryCount,
    webDomainCount: meta.webDomainCount,
  };
}

/** Human-readable count for settings rows ("3 apps", "2 categories"). */
export function formatScreenTimeSelectionSummary(
  summary: ScreenTimeSelectionSummary | null,
): string {
  if (!summary) return "No apps selected yet";
  const parts: string[] = [];
  if (summary.applicationCount > 0) {
    parts.push(
      `${summary.applicationCount} ${summary.applicationCount === 1 ? "app" : "apps"}`,
    );
  }
  if (summary.categoryCount > 0) {
    parts.push(
      `${summary.categoryCount} ${summary.categoryCount === 1 ? "category" : "categories"}`,
    );
  }
  if (summary.webDomainCount > 0) {
    parts.push(
      `${summary.webDomainCount} ${summary.webDomainCount === 1 ? "site" : "sites"}`,
    );
  }
  return parts.length > 0 ? parts.join(", ") : "No apps selected yet";
}

export function isScreenTimeShieldReady(): boolean {
  return (
    isNativeScreenTimeAvailable() &&
    isScreenTimeAuthorized() &&
    hasScreenTimeAppSelection()
  );
}

/** Install Closer-branded shield UI into the app-group UserDefaults. */
export function configureCloserShieldUI(): void {
  if (!isNativeScreenTimeAvailable()) return;

  updateShield(
    {
      title: NATIVE_SHIELD_TITLE,
      subtitle: NATIVE_SHIELD_SUBTITLE,
      primaryButtonLabel: NATIVE_SHIELD_PRIMARY_LABEL,
      iconSystemName: "lock.shield.fill",
      backgroundBlurStyle: 19,
      titleColor: { red: 255, green: 255, blue: 255 },
      subtitleColor: { red: 204, green: 204, blue: 204 },
      primaryButtonBackgroundColor: {
        red: 255,
        green: 255,
        blue: 255,
        alpha: 0.14,
      },
      primaryButtonLabelColor: { red: 255, green: 255, blue: 255 },
    },
    {
      primary: { behavior: "close" },
    },
    "closer-configure-shield",
  );
}

export async function startNativeScreenTimeShield(): Promise<boolean> {
  if (!isScreenTimeShieldReady()) return false;

  try {
    configureCloserShieldUI();
    blockSelection(
      { activitySelectionId: FOCUS_FAMILY_ACTIVITY_SELECTION_ID },
      "closer-shield-start",
    );
    return isShieldActive();
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[focus] blockSelection failed", error);
    }
    return false;
  }
}

export function stopNativeScreenTimeShield(): void {
  if (!isNativeScreenTimeAvailable()) return;

  unblockSelection(
    { activitySelectionId: FOCUS_FAMILY_ACTIVITY_SELECTION_ID },
    "closer-shield-stop",
  );
  resetBlocks("closer-shield-stop");
}
