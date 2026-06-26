import type { RefObject } from "react";
import {
  Alert,
  findNodeHandle,
  TurboModuleRegistry,
  type View,
} from "react-native";
import { isMediaLibraryAvailable } from "@/lib/mediaLibraryAvailable";
import { isPhotoSaveAvailable } from "@/lib/photoSaveAvailable";

type ViewShotModule = {
  captureRef: (target: number, options: object) => Promise<string>;
};

function getViewShotModule(): ViewShotModule | null {
  if (!isPhotoSaveAvailable()) return null;
  return TurboModuleRegistry.get("RNViewShot") as ViewShotModule | null;
}

/**
 * Capture a view ref and save the PNG to the user's photo library.
 *
 * Never imports react-native-view-shot or expo-media-library at
 * module scope — both can crash at load time when the native
 * module is missing from the binary.
 */
export async function captureViewToPhotos(
  ref: RefObject<View | null>,
): Promise<boolean> {
  if (!isPhotoSaveAvailable() || !isMediaLibraryAvailable()) {
    Alert.alert(
      "Update required",
      "Saving scripture images needs the latest Closer build from TestFlight. Update the app, then try again.",
    );
    return false;
  }

  const viewShot = getViewShotModule();
  if (!viewShot || !ref.current) return false;

  let MediaLibrary: typeof import("expo-media-library");
  try {
    MediaLibrary = await import("expo-media-library");
  } catch {
    Alert.alert(
      "Update required",
      "Saving scripture images needs the latest Closer build from TestFlight. Update the app, then try again.",
    );
    return false;
  }

  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Photos access needed",
      "Allow Closer to save images to your library so you can keep scripture wallpapers.",
    );
    return false;
  }

  const node = findNodeHandle(ref.current);
  if (!node) {
    Alert.alert(
      "Couldn't save",
      "Something went wrong saving this image. Try again in a moment.",
    );
    return false;
  }

  try {
    const uri = await viewShot.captureRef(node, {
      format: "png",
      quality: 1,
      result: "tmpfile",
    });
    await MediaLibrary.saveToLibraryAsync(uri);
    return true;
  } catch {
    Alert.alert(
      "Couldn't save",
      "Something went wrong saving this image. Try again in a moment.",
    );
    return false;
  }
}
