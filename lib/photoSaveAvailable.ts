import { TurboModuleRegistry } from "react-native";

let cached: boolean | null = null;

/**
 * Whether this native binary includes react-native-view-shot.
 *
 * OTA bundles can ship JS that references view-shot before a
 * TestFlight build compiles the native module in. Importing the
 * package itself calls TurboModuleRegistry.getEnforcing and
 * crashes immediately — so callers must gate on this helper
 * instead of importing react-native-view-shot at module scope.
 */
export function isPhotoSaveAvailable(): boolean {
  if (cached !== null) return cached;
  try {
    cached = TurboModuleRegistry.get("RNViewShot") != null;
  } catch {
    cached = false;
  }
  return cached;
}
