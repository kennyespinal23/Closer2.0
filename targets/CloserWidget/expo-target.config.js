/** Closer's Home Screen and Lock Screen widgets. The app writes a snapshot of the day to the shared App Group. */
/** @type {import('@kingstinct/expo-apple-targets/build/config-plugin').ConfigFunction} */
module.exports = () => ({
  type: "widget",
  name: "CloserWidget",
  bundleIdentifier: ".widget",
  deploymentTarget: "17.0",
  entitlements: {
    "com.apple.security.application-groups": ["group.com.espinalcapital.closer"],
  },
});
