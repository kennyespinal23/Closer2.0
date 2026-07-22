/**
 * One-shot launch splash per cold start.
 *
 * Armed when a returning user is routed home; consumed once the
 * branded overlay finishes so it never replays mid-session.
 */
let launchSplashConsumed = false;
let launchSplashArmed = true;

export function suppressLaunchSplashUntilRouted(): void {
  launchSplashArmed = false;
}

export function armLaunchSplash(): void {
  launchSplashArmed = true;
}

export function consumeLaunchSplash(): boolean {
  if (launchSplashConsumed || !launchSplashArmed) return false;
  launchSplashConsumed = true;
  return true;
}

export function shouldPlayLaunchSplash(): boolean {
  return launchSplashArmed && !launchSplashConsumed;
}

export function skipLaunchSplashForSession(): void {
  launchSplashConsumed = true;
  launchSplashArmed = false;
}
