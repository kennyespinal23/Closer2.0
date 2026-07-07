import { useEffect, useRef } from "react";
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
  const ref = useRef<LottieView>(null);

  const playLoop = () => {
    ref.current?.play(LOOP_START_FRAME, LOOP_END_FRAME);
  };

  useEffect(() => {
    playLoop();
  }, []);

  return (
    <LottieView
      ref={ref}
      source={FIRE_STREAK_ANIMATION}
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
