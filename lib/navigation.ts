import type { Href, Router } from "expo-router";

/**
 * Pop one screen when the stack has history; otherwise land on a
 * known-safe route. Use on custom-header screens (`headerShown:
 * false`) that are normally pushed but can also open from a cold
 * deep link with an empty stack — raw `router.back()` is a no-op
 * there and strands the user.
 */
export function goBackOr(router: Router, fallback: Href) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}
