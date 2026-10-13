const appJson = require("./app.json");

/**
 * Dynamic Expo config.
 *
 * Set `INCLUDE_DEVICE_ACTIVITY=false` on an EAS build profile to
 * ship without Screen Time extensions (e.g. while waiting on Apple's
 * Family Controls distribution approval). Focus mode falls back to
 * honor-system on those builds.
 */
module.exports = ({ config }) => {
  const includeDeviceActivity =
    process.env.INCLUDE_DEVICE_ACTIVITY !== "false";

  const plugins = appJson.expo.plugins.filter((entry) => {
    const name = Array.isArray(entry) ? entry[0] : entry;
    return includeDeviceActivity || name !== "react-native-device-activity";
  });

  // OTA publication evaluates plugins but must not recopy native extension files.
  // Native builds retain the plugin's normal target generation behavior.
  if (process.env.EAS_SKIP_AUTO_FINGERPRINT === "1") {
    const index = plugins.findIndex(entry =>
      (Array.isArray(entry) ? entry[0] : entry) === "react-native-device-activity"
    );
    if (index !== -1) {
      const entry = plugins[index];
      plugins[index] = ["react-native-device-activity", {
        ...(Array.isArray(entry) ? entry[1] : {}), copyToTargetFolder: false,
      }];
    }
  }

  const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
  if (googleIosUrlScheme) {
    plugins.push([
      "@react-native-google-signin/google-signin",
      { iosUrlScheme: googleIosUrlScheme },
    ]);
  }

  const { ios, icon, ...rest } = appJson.expo;

  return {
    ...config,
    ...rest,
    icon,
    ios: {
      ...config.ios,
      ...ios,
      icon: ios.icon ?? icon,
    },
    plugins,
  };
};
