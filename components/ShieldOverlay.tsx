import { Modal, Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";
import { ShieldScreen } from "@/components/ShieldScreen";

/**
 * ShieldOverlay — full-screen preview of the OS block shield.
 *
 * Used in settings (per-app quiet-message preview) and dev tools.
 * Composes ShieldScreen so the preview matches what Screen Time
 * shows on device.
 */

export type ShieldOverlayProps = {
  appId: string;
  visible: boolean;
  onClose: () => void;
  onEndFocus?: () => void;
};

export function ShieldOverlay({
  appId,
  visible,
  onClose,
  onEndFocus,
}: ShieldOverlayProps) {
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
        primaryLabel="OK"
        onPrimaryPress={onClose}
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
