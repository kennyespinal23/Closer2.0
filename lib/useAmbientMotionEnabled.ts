import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** Ambient loops only run while their route and the app are visible. */
export function useAmbientMotionEnabled() {
  const focused = useIsFocused();
  const reduced = useReducedMotion();
  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const subscription = AppState.addEventListener("change", state => setActive(state === "active"));
    return () => subscription.remove();
  }, []);
  return focused && active && !reduced;
}
