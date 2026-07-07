/** RevenueCat entitlement — create this identifier in the RC dashboard. */
export const REVENUECAT_ENTITLEMENT_ID = "pro";

/** iOS public SDK key from RevenueCat → Project → API keys → Apple. */
export function getRevenueCatIosApiKey(): string {
  return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "";
}

export function isRevenueCatConfigured(): boolean {
  return getRevenueCatIosApiKey().length > 0;
}
