import { Platform, Share, type ShareContent, type ShareOptions } from "react-native";

/**
 * `lib/share` — centralized iOS-native share for Closer.
 *
 * Why a wrapper around `Share.share` instead of inline call sites:
 *
 *   1. **Consistent voice.** Every shared scripture / sermon / check-in
 *      reads the same way ("— Book chapter:verse (Translation)", a
 *      blank line, then "via Closer"). Apple's own apps do this:
 *      News articles, Music tracks, Books quotes all end in a
 *      uniform "Shared from X" footer that the recipient instantly
 *      recognizes as a category.
 *
 *   2. **Subject lines.** iOS Mail and some 3rd-party share targets
 *      (Bear, Notes) use the `title` field as the subject / note
 *      title. RN's Share API takes it on both platforms but most
 *      of our existing call sites omit it. Setting a meaningful
 *      title means a forwarded verse in Mail arrives as
 *      "John 3:16 · Closer" instead of "(no subject)".
 *
 *   3. **Future-ready for deep links.** When we ship a public
 *      `closer.app` domain + apple-app-site-association + Associated
 *      Domains entitlement, every helper here can grow a `url`
 *      field in one place — `shareVerse` becomes a Universal Link
 *      back into the chapter, `shareSermon` deep-links into the
 *      sermon, and the iMessage bubble unfurls into a rich
 *      preview without touching call sites. Today we deliberately
 *      DO NOT pass a `url` because Closer has no public web
 *      presence yet — a dead URL in iMessage reads worse than no
 *      URL at all (recipient taps it, gets a 404).
 *
 *   4. **Silent on cancel.** Every existing call site wraps the
 *      Share call in try/catch to swallow user-dismissed shares
 *      (which RN surfaces as a rejection on some platforms). The
 *      wrapper handles this once, returning `{ status }` so
 *      callers can distinguish "user shared" from "user cancelled"
 *      from "actually broken" without ever throwing.
 *
 * iOS-only attribution string. Hardcoded "via Closer" rather than
 * the app name reading from app.json because copy is part of the
 * brand and shouldn't accidentally become "via closer" or anything
 * cased differently if the bundle display name changes.
 */
const ATTRIBUTION = "via Closer";

export type ShareResult =
  | { status: "shared"; activityType?: string }
  | { status: "dismissed" }
  | { status: "error"; message: string };

/**
 * Format a verse share — the most common share in the app.
 * Used by the chapter reader (single + range), check-ins, verse-of-day,
 * mood-delivered verse, and the prayer scripture screen.
 *
 *   "Whoever calls on the name of the Lord shall be saved."
 *
 *   — Romans 10:13 (ESV)
 *
 *   via Closer
 *
 * Translation is optional — single-verse fallbacks from places that
 * don't have it (insights articles citing scripture without a
 * specific edition) drop the parenthetical cleanly.
 */
export async function shareVerse(opts: {
  text: string;
  reference: string;
  translation?: string;
}): Promise<ShareResult> {
  const cite = opts.translation
    ? `— ${opts.reference} (${opts.translation})`
    : `— ${opts.reference}`;
  const message = `"${opts.text}"\n\n${cite}\n\n${ATTRIBUTION}`;
  return shareRaw({
    title: `${opts.reference} · Closer`,
    message,
  });
}

/**
 * Format a multi-verse share — used by the chapter reader when the
 * user has multiple verses selected. Caller already joins the verse
 * texts in reading order; we just format the citation + attribution.
 *
 *   "For God so loved the world... but have eternal life."
 *
 *   — John 3:16–17 (ESV)
 *
 *   via Closer
 */
export async function sharePassage(opts: {
  text: string;
  reference: string;
  translation?: string;
}): Promise<ShareResult> {
  return shareVerse(opts);
}

/**
 * Format an insight share — long-form article from Insights tab.
 *
 *   Article title
 *
 *   Subtitle / hook line.
 *
 *   via Closer
 */
export async function shareInsight(opts: {
  title: string;
  subtitle?: string;
}): Promise<ShareResult> {
  const lines = [opts.title];
  if (opts.subtitle) lines.push("", opts.subtitle);
  lines.push("", ATTRIBUTION);
  return shareRaw({
    title: `${opts.title} · Closer`,
    message: lines.join("\n"),
  });
}

/**
 * Format a raw share — for data exports, debug dumps, anything
 * outside the standard scripture/insight shapes. The title and
 * message pass straight through (no auto-attribution because
 * exported JSON shouldn't have a "via Closer" line glued to it).
 */
export async function shareRaw(content: ShareContent): Promise<ShareResult> {
  const options: ShareOptions = {
    // On iOS, having no `subject` makes Mail use the message's
    // first line. With Share-via-Mail this means the subject becomes
    // an open quote ("…) — passing a real subject makes the email
    // look intentional. Subject is iOS-only.
    subject:
      Platform.OS === "ios" && "title" in content && content.title
        ? content.title
        : undefined,
  };
  try {
    const result = await Share.share(content, options);
    if (result.action === Share.sharedAction) {
      return { status: "shared", activityType: result.activityType };
    }
    return { status: "dismissed" };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
