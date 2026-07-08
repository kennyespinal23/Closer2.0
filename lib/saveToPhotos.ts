import type { RefObject } from "react";
import { Alert, Platform, Share, type View } from "react-native";
import { isMediaLibraryAvailable } from "@/lib/mediaLibraryAvailable";
import { isPhotoSaveAvailable } from "@/lib/photoSaveAvailable";
import type { ShareResult } from "@/lib/share";

const CAPTURE_OPTIONS = {
  format: "png" as const,
  quality: 1,
  result: "tmpfile" as const,
};

function loadCaptureRef() {
  // Gate on isPhotoSaveAvailable() before calling — never require at
  // module scope (getEnforcing crashes when the pod isn't in the binary).
  // Synchronous require avoids Metro's broken async-require for this package.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("react-native-view-shot") as typeof import(
    "react-native-view-shot"
  );
  return mod.captureRef;
}

/** Copy view-shot tmpfile to a named .png so iOS treats it as a photo. */
async function preparePngShareUri(
  uri: string,
  nameBase?: string,
): Promise<string> {
  const fileUri = uri.startsWith("file://") ? uri : `file://${uri}`;
  if (Platform.OS !== "ios") return fileUri;

  const slug =
    nameBase
      ?.replace(/:/g, "-")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") || "closer-scripture";
  const filename = slug.toLowerCase().endsWith(".png") ? slug : `${slug}.png`;

  if (fileUri.endsWith(filename)) return fileUri;

  try {
    const FileSystem = await import("expo-file-system/legacy");
    const dest = `${FileSystem.documentDirectory}${filename}`;
    const existing = await FileSystem.getInfoAsync(dest);
    if (existing.exists) {
      await FileSystem.deleteAsync(dest, { idempotent: true });
    }
    await FileSystem.copyAsync({ from: fileUri, to: dest });
    return dest;
  } catch (err) {
    if (__DEV__) {
      console.warn("[preparePngShareUri] copy failed:", err);
    }
    return fileUri;
  }
}

/**
 * Capture a view ref to a temporary PNG file URI.
 * Used for Photos saves and image shares — callers should hide
 * chrome outside the ref so the export is text + backdrop only.
 */
export async function captureViewToUri(
  ref: RefObject<View | null>,
): Promise<string | null> {
  if (!isPhotoSaveAvailable() || !ref.current) return null;

  try {
    const captureRef = loadCaptureRef();
    return await captureRef(ref, CAPTURE_OPTIONS);
  } catch (err) {
    if (__DEV__) {
      console.warn("[captureViewToUri] capture failed:", err);
    }
    return null;
  }
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

  const uri = await captureViewToUri(ref);
  if (!uri) {
    Alert.alert(
      "Couldn't save",
      "Something went wrong saving this image. Try again in a moment.",
    );
    return false;
  }

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

  try {
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

/** Share a captured view image through the iOS share sheet. */
export async function shareViewImage(opts: {
  ref: RefObject<View | null>;
  title?: string;
  message?: string;
  /** Used for the shared PNG filename, e.g. "Romans 8:26". */
  filenameBase?: string;
}): Promise<ShareResult> {
  if (!isPhotoSaveAvailable()) {
    return {
      status: "error",
      message: "Image sharing needs the latest Closer build from TestFlight.",
    };
  }

  const uri = await captureViewToUri(opts.ref);
  if (!uri) {
    return {
      status: "error",
      message: "Couldn't create the scripture image. Try again in a moment.",
    };
  }

  const shareUrl = await preparePngShareUri(
    uri,
    opts.filenameBase ?? opts.title?.replace(/ · Closer$/, ""),
  );

  try {
    if (Platform.OS === "ios") {
      const Sharing = await import("expo-sharing");
      if (!(await Sharing.isAvailableAsync())) {
        return {
          status: "error",
          message: "Sharing isn't available on this device.",
        };
      }
      // expo-sharing passes a file URL directly to UIActivityViewController.
      // RN Share routes through ActionSheetManager and often surfaces
      // "Save to Files" instead of "Save Image" even for PNGs.
      await Sharing.shareAsync(shareUrl, { UTI: "public.png" });
      return { status: "shared" };
    }

    const result = await Share.share(
      {
        title: opts.title,
        message: opts.message,
        url: shareUrl,
      },
      opts.title ? { subject: opts.title } : undefined,
    );
    if (result.action === Share.sharedAction) {
      return {
        status: "shared",
        activityType: result.activityType ?? undefined,
      };
    }
    return { status: "dismissed" };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
