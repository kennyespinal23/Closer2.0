/* The app's frame: the tab bar and the small messages that float over every tab. */
export const app = {
  tabs: {
    // tab bar labels: one short word each, under an icon (about 9 letters fit)
    today: "Today",
    bible: "Bible",
    explore: "Explore",
    community: "Community",
    profile: "You",
    // screen-reader name for the tab bar
    nav: "Main",
  },
  // toast when someone taps an experience that isn't written yet; {title} is its name
  notReady: "{title} is still being written. Soon.",
};
