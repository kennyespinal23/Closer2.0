import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Whether VoiceOver (or TalkBack) is running, kept up to date. */
export function useScreenReader() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isScreenReaderEnabled().then(value => { if (alive) setOn(value); });
    const event = AccessibilityInfo.addEventListener("screenReaderChanged", setOn);
    return () => { alive = false; event.remove(); };
  }, []);
  return on;
}
