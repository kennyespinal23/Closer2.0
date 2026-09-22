import { useAmbientMotionEnabled } from "@/lib/useAmbientMotionEnabled";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import LottieView from "lottie-react-native";

const FIRE_STREAK_ANIMATION = require("../assets/lottie/FireStreakAnimation.json");

/** Skip frame 0 on loop — it reads as a black flash before the flame restarts. */
const LOOP_START_FRAME = 2;
const LOOP_END_FRAME = 24;

/**
 * Seamlessly looping streak flame. Uses a manual segment loop
 * instead of Lottie's built-in `loop` so the animation never
 * snaps back through the empty first frame.
 */
export function StreakFireAnimation({
  size = 88,
}: {
  size?: number;
}) {
  const reducedMotion = useReducedMotion();
  const ambientEnabled = useAmbientMotionEnabled();
  const ref = useRef<LottieView>(null);

  const playLoop = () => {
    if (!ambientEnabled) return;
    ref.current?.play(LOOP_START_FRAME, LOOP_END_FRAME);
  };

  useEffect(() => {
    if (!ambientEnabled) ref.current?.pause();
    else playLoop();
    return () => ref.current?.pause();
  }, [ambientEnabled]);

  return (
    <LottieView
      ref={ref}
      source={FIRE_STREAK_ANIMATION}
      progress={reducedMotion ? 0.5 : undefined}
      loop={false}
      autoPlay={false}
      onAnimationFinish={playLoop}
      style={{
        width: size,
        height: size,
        backgroundColor: "transparent",
      }}
    />
  );
}
