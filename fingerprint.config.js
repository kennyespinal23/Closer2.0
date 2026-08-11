module.exports = {
  /** Screen Time extension targets trip EAS Update fingerprint with
   *  EEXIST on Shared.swift copies — ignore the whole targets tree for
   *  fingerprinting (native builds still compile them). */
  ignorePaths: ["targets/**"],
  /** Avoid p-limit crash when concurrentIoLimit is unset in some CLI paths. */
  concurrentIoLimit: 8,
};
