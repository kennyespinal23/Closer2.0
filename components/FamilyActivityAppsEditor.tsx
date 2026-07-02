import { DeviceActivitySelectionSheetViewPersisted } from "react-native-device-activity";
import {
  FOCUS_FAMILY_ACTIVITY_SELECTION_ID,
  hasScreenTimeAppSelection,
  isNativeScreenTimeAvailable,
} from "@/lib/deviceActivityShield";

export type FamilyActivityAppsEditorProps = {
  visible: boolean;
  onClose: () => void;
  /** Fired after the user saves a selection in the native sheet. */
  onSaved?: () => void;
};

/**
 * Presents Apple's native FamilyActivityPicker sheet (system Cancel/Done).
 *
 * Mount this when `visible` is true — the library's invisible anchor
 * triggers the same iOS sheet Opal and Screen Time apps use. No custom
 * modal or auth gate; authorization is requested on the button tap
 * before this mounts (see `openNativeAppPickerWithAuth`).
 */
export function FamilyActivityAppsEditor({
  visible,
  onClose,
  onSaved,
}: FamilyActivityAppsEditorProps) {
  if (!visible || !isNativeScreenTimeAvailable()) {
    return null;
  }

  return (
    <DeviceActivitySelectionSheetViewPersisted
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: 1,
        height: 1,
        opacity: 0,
      }}
      familyActivitySelectionId={FOCUS_FAMILY_ACTIVITY_SELECTION_ID}
      headerText="Apps to quiet"
      footerText="Categories like Social or Games block every app in that group."
      includeEntireCategory
      onDismissRequest={() => {
        if (hasScreenTimeAppSelection()) {
          onSaved?.();
        }
        onClose();
      }}
      onSelectionChange={() => {
        /* Persisted variant writes selection natively by id. */
      }}
    />
  );
}
