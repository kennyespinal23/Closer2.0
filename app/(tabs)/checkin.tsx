import { Redirect } from "expo-router";

/**
 * Placeholder for the "+" tab.
 *
 * The bottom navigation has a center "+" cell that opens the
 * full-screen check-in modal (`/check-in`) instead of behaving as a
 * normal tab destination. We register the slot as a `Tabs.Screen`
 * so the GlassTabBar can render it in its row layout, but we
 * intercept the press in the tab listener and never actually
 * navigate here.
 *
 * In the unlikely case the route IS reached (e.g. a deep-link, a
 * dev tap on the cell while the listener is hot-reloading), redirect
 * the user back to the home tab. The check-in surface should only
 * ever be entered via the modal flow.
 */
export default function CheckInTabRedirect() {
  return <Redirect href="/today" />;
}
