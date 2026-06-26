/**
 * One-shot launch splash per cold start.
 *
 * Suppressed while the returning-user router decides between the
 * rotating-moment beat and home, and for the whole session when
 * the moment screen opens first.
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
