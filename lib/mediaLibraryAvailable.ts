import { TurboModuleRegistry } from "react-native";

let cached: boolean | null = null;

/**
 * Whether this native binary includes expo-media-library.
 *
 * Importing `expo-media-library` runs `requireNativeModule` at
 * module scope and can hard-crash when the native module is missing
 * from an older TestFlight binary. Gate scripture save (and any
 * dynamic import of saveToPhotos) on this helper first.
 */
export function isMediaLibraryAvailable(): boolean {
  if (cached !== null) return cached;
  try {
    cached = TurboModuleRegistry.get("ExpoMediaLibrary") != null;
  } catch {
    cached = false;
  }
  return cached;
}
