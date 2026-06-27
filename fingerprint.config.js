module.exports = {
  /** Duplicate Shared.swift copies across Screen Time targets confuse fingerprint. */
  ignorePaths: ["targets/**/Shared.swift"],
  /** Avoid p-limit crash when concurrentIoLimit is unset in some CLI paths. */
  concurrentIoLimit: 8,
};
