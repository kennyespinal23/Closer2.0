import * as Notifications from "expo-notifications";
import { Modal } from "react-native";
import Svg, { Path } from "react-native-svg";
import { ShieldScreen } from "@/components/ShieldScreen";
import {
  SHIELD_RETURN_NOTIFICATION,
  shieldBodyForPath,
  shieldPrimaryLabel,
  type ShieldPrimaryPath,
} from "@/lib/shieldCopy";

/**
 * ShieldOverlay — full-screen preview of the OS block shield.
 *
 * Used in settings (per-app quiet-message preview) and to demo the
 * two primary paths: notify (fires immediate local notif → /today)
 * and manual (honest copy, dismiss only).
 */

export type ShieldOverlayProps = {
  appId: string;
  visible: boolean;
  onClose: () => void;
  onEndFocus?: () => void;
  /**
   * Which shield primary path to preview. Defaults to `"manual"` so
   * a settings preview never silently no-ops when permission is off.
   * Focus settings passes the live / forced path.
   */
  primaryPath?: ShieldPrimaryPath;
};

export function ShieldOverlay({
  appId,
  visible,
  onClose,
  onEndFocus,
  primaryPath = "manual",
}: ShieldOverlayProps) {
  const label = shieldPrimaryLabel(primaryPath);
  const body = shieldBodyForPath(primaryPath, appId);

  const handlePrimary = () => {
    if (primaryPath === "notify") {
      void Notifications.scheduleNotificationAsync({
        content: {
          title: SHIELD_RETURN_NOTIFICATION.title,
          body: SHIELD_RETURN_NOTIFICATION.body,
          sound: "default",
          // Mirrors native shield action — best-effort through Focus.
          interruptionLevel: "timeSensitive",
          data: {
            kind: SHIELD_RETURN_NOTIFICATION.kind,
            route: SHIELD_RETURN_NOTIFICATION.route,
          },
        },
        trigger: null,
      });
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <ShieldScreen
        appId={appId}
        variant="device"
        bodyOverride={body}
        primaryLabel={label}
        onPrimaryPress={handlePrimary}
        secondaryLabel={onEndFocus ? "End focus" : undefined}
        onSecondaryPress={onEndFocus}
      />
    </Modal>
  );
}

export function ShieldOverlayGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l8 3v6c0 4-3 7-8 9-5-2-8-5-8-9V6l8-3z"
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
