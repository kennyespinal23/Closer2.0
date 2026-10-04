import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated } from "react-native";
import { useReducedMotion } from "./useReducedMotion";

export const ReaderChromeBusyContext = createContext<(busy: boolean) => void>(() => {});

/** Keep layout fixed while chrome leaves, so hiding never repaginates scripture. */
export function useReaderChrome(paused: boolean, focused: boolean, idleMs = 4200) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [screenReader, setScreenReader] = useState(false);
  const visibility = useRef(new Animated.Value(1)).current;
  const visibleRef = useRef(true), revealOnly = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = useCallback(() => { if (timer.current) clearTimeout(timer.current); timer.current = null; }, []);
  const reveal = useCallback(() => {
    clear(); visibleRef.current = true; setVisible(true);
    if (!paused && !screenReader && focused) timer.current = setTimeout(() => { visibleRef.current = false; setVisible(false); }, idleMs);
  }, [paused, screenReader, focused, clear, idleMs]);
  useEffect(() => { let alive = true; void AccessibilityInfo.isScreenReaderEnabled().then(value => { if (alive) setScreenReader(value); }); const event = AccessibilityInfo.addEventListener("screenReaderChanged", setScreenReader); return () => { alive = false; event.remove(); }; }, []);
  useEffect(() => { reveal(); return clear; }, [reveal, clear]);
  useEffect(() => { Animated.timing(visibility, { toValue: visible ? 1 : 0, duration: reduced ? 0 : 280, useNativeDriver: true }).start(); return () => visibility.stopAnimation(); }, [visible, reduced, visibility]);
  const onTouch = () => { revealOnly.current = !visibleRef.current; reveal(); };
  return { visible, revealOnly, onTouch, reveal, topStyle: { opacity: visibility, transform: [{ translateY: visibility.interpolate({ inputRange: [0, 1], outputRange: [-64, 0] }) }] }, bottomStyle: { opacity: visibility, transform: [{ translateY: visibility.interpolate({ inputRange: [0, 1], outputRange: [48, 0] }) }] } };
}
