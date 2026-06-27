/**
 * Expo fingerprint config — duplicate Shared.swift copies across Screen
 * Time extension targets confuse @expo/fingerprint on EAS Update.
 */
module.exports = {
  ignorePaths: ["targets/**/Shared.swift"],
};
