import * as Updates from "expo-updates";

/**
 * True for local dev and internal distribution (TestFlight, preview).
 * App Store production-channel installs return false.
 */
export function isInternalBuild(): boolean {
  if (__DEV__) return true;
  if (!Updates.isEnabled) return false;
  const channel = Updates.channel;
  return (
    channel === "testflight" ||
    channel === "preview" ||
    channel === "development"
  );
}
