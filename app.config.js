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

  return {
    ...config,
    ...appJson.expo,
    plugins,
  };
};
