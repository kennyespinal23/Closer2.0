/** Native tab measurements can include the home-indicator band.
 * Keep scroll content above both the bar and an optional focus player.
 */
export function tabContentClearance(measuredHeight: number, bottomInset: number, playerHeight = 0) {
  const bar = measuredHeight > 0
    ? measuredHeight >= 70 ? measuredHeight : measuredHeight + bottomInset
    : 49 + bottomInset;
  return bar + playerHeight + 24;
}
