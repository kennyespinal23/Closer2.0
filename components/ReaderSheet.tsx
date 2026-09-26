import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";
import { AppleSheet, type AppleSheetProps } from "@/components/AppleSheet";
import { useColors } from "@/state/theme";

/** Native system material for reader panels, with an explicit accessibility fallback. */
export function ReaderSheet(props: AppleSheetProps) {
  const colors = useColors();
  const [opaque, setOpaque] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then(value => { if (active) setOpaque(value); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceTransparencyChanged", setOpaque);
    return () => { active = false; subscription.remove(); };
  }, []);
  return <AppleSheet {...props} backgroundColor={props.backgroundColor !== undefined ? props.backgroundColor : Platform.OS === "ios" && !opaque ? null : colors.surface} />;
}
