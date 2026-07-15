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
  refreshManagedSettingsStore,
  requestAuthorization,
  unblockSelection,
  updateShield,
  type AuthorizationStatusType,
} from "react-native-device-activity";
import { getNotificationPermission } from "@/lib/notifications";
import {
  NATIVE_SHIELD_TITLE,
  SHIELD_RETURN_NOTIFICATION,
  shieldNativeSubtitle,
  shieldPrimaryLabel,
  type ShieldPrimaryPath,
} from "@/lib/shieldCopy";

export { AuthorizationStatus, type AuthorizationStatusType };

/** Persisted FamilyActivitySelection id — shared by picker + shield. */
export const FOCUS_FAMILY_ACTIVITY_SELECTION_ID = "closer-focus-selection";

/**
 * Home route for the shield-return notification tap handler
 * (`lib/notificationDeepLink.tsx`). Scheme form is `closer://today`.
 */
export const CLOSER_TODAY_DEEP_LINK = "closer://today";

/** Resolve which primary path the native shield should use right now. */
export async function resolveShieldPrimaryPath(): Promise<ShieldPrimaryPath> {
  const permission = await getNotificationPermission();
  return permission === "granted" ? "notify" : "manual";
}

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
 * Fire Apple's Screen Time authorization sheet. Must be the first
 * native call in a button `onPress` — no `await` before this.
 */
export function kickOffScreenTimeAuthorizationFromGesture(): void {
  if (!isNativeScreenTimeAvailable()) return;
  if (getScreenTimeAuthorizationStatus() === AuthorizationStatus.approved) {
    return;
  }
  void requestAuthorization("individual");
}

/** Earliest hook in a touch — pair with `openNativeAppPickerWithAuth` on `onPress`. */
export function primeScreenTimeAuthorizationFromGesture(): void {
  kickOffScreenTimeAuthorizationFromGesture();
}

/** Wait for the system authorization dialog to resolve (poll + events). */
export async function waitForScreenTimeAuthorizationResult(): Promise<AuthorizationStatusType> {
  if (!isNativeScreenTimeAvailable()) {
    return AuthorizationStatus.notDetermined;
  }

  if (getScreenTimeAuthorizationStatus() === AuthorizationStatus.approved) {
    return AuthorizationStatus.approved;
  }

  let subscription: ReturnType<typeof onAuthorizationStatusChange> | undefined;
  const statusFromEvent = new Promise<AuthorizationStatusType>((resolve) => {
    const timeout = setTimeout(() => {
      resolve(getAuthorizationStatus());
    }, 120_000);

    subscription = onAuthorizationStatusChange((event) => {
      if (event.authorizationStatus === AuthorizationStatus.approved) {
        clearTimeout(timeout);
        resolve(AuthorizationStatus.approved);
      } else if (event.authorizationStatus === AuthorizationStatus.denied) {
        clearTimeout(timeout);
        resolve(AuthorizationStatus.denied);
      }
    });
  });

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

/**
 * One-tap flow: fire Apple's authorization sheet from the gesture, then
 * run `onAuthorized` (e.g. present the native app picker) once approved.
 */
export function openNativeAppPickerWithAuth({
  onAuthorized,
}: {
  onAuthorized: () => void;
}): void {
  if (!isNativeScreenTimeAvailable()) return;

  if (getScreenTimeAuthorizationStatus() === AuthorizationStatus.approved) {
    onAuthorized();
    return;
  }

  kickOffScreenTimeAuthorizationFromGesture();
  void waitForScreenTimeAuthorizationResult().then((status) => {
    if (status === AuthorizationStatus.approved) {
      onAuthorized();
    }
  });
}

/**
 * Request Screen Time authorization end-to-end. Prefer
 * `openNativeAppPickerWithAuth` at button sites so the system sheet
 * fires in the same gesture turn.
 */
export async function requestScreenTimeAuthorization(): Promise<AuthorizationStatusType> {
  if (!isNativeScreenTimeAvailable()) {
    return AuthorizationStatus.notDetermined;
  }

  const existing = getScreenTimeAuthorizationStatus();
  if (existing === AuthorizationStatus.approved) {
    return AuthorizationStatus.approved;
  }

  kickOffScreenTimeAuthorizationFromGesture();
  return waitForScreenTimeAuthorizationResult();
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

/**
 * Install Closer-branded shield UI + primary action into app-group
 * UserDefaults.
 *
 * Permission granted → primary fires an immediate local notification
 * (`type: "sendNotification"`) whose tap routes to `/today`.
 * Otherwise → honest manual-open copy; primary only closes the shield.
 *
 * Public entry stays sync so existing callers don't await; the
 * permission read runs async and updates shield config when ready.
 */
export function configureCloserShieldUI(): void {
  if (!isNativeScreenTimeAvailable()) return;
  void configureCloserShieldUIForPath();
}

/** Force a specific path — used by previews and after an await. */
export async function configureCloserShieldUIForPath(
  path?: ShieldPrimaryPath,
): Promise<ShieldPrimaryPath> {
  if (!isNativeScreenTimeAvailable()) {
    return path ?? "manual";
  }

  const resolved = path ?? (await resolveShieldPrimaryPath());
  const subtitle = shieldNativeSubtitle(resolved);
  const primaryButtonLabel = shieldPrimaryLabel(resolved);

  const actions =
    resolved === "notify"
      ? {
          primary: {
            type: "sendNotification" as const,
            behavior: "close" as const,
            payload: {
              title: SHIELD_RETURN_NOTIFICATION.title,
              body: SHIELD_RETURN_NOTIFICATION.body,
              sound: "default" as const,
              // Best-effort through Focus when the system allows it —
              // Closer does not have a Time Sensitive entitlement, so
              // Focus can still suppress this.
              interruptionLevel: "timeSensitive" as const,
              userInfo: {
                kind: SHIELD_RETURN_NOTIFICATION.kind,
                route: SHIELD_RETURN_NOTIFICATION.route,
              },
            },
          },
        }
      : {
          primary: { behavior: "close" as const },
        };

  updateShield(
    {
      title: NATIVE_SHIELD_TITLE,
      subtitle,
      primaryButtonLabel,
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
    actions as Parameters<typeof updateShield>[1],
    "closer-configure-shield",
  );

  return resolved;
}

/** Call after the user saves apps in Apple's picker. */
export function applyScreenTimeConfiguration(): void {
  if (!isNativeScreenTimeAvailable()) return;
  configureCloserShieldUI();
}

export async function startNativeScreenTimeShield(): Promise<boolean> {
  if (!isScreenTimeShieldReady()) return false;
  if (countScreenTimeSelectionItems() === 0) return false;

  try {
    await configureCloserShieldUIForPath();
    refreshManagedSettingsStore();
    blockSelection(
      { activitySelectionId: FOCUS_FAMILY_ACTIVITY_SELECTION_ID },
      "closer-shield-start",
    );
    if (!isShieldActive()) {
      refreshManagedSettingsStore();
      blockSelection(
        { activitySelectionId: FOCUS_FAMILY_ACTIVITY_SELECTION_ID },
        "closer-shield-start-retry",
      );
    }
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
}
