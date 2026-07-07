import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";
import {
  getRevenueCatIosApiKey,
  isRevenueCatConfigured,
  REVENUECAT_ENTITLEMENT_ID,
} from "@/lib/revenuecatConfig";

let configured = false;

export function hasProEntitlement(info: CustomerInfo): boolean {
  return (
    info.entitlements.active[REVENUECAT_ENTITLEMENT_ID] !== undefined
  );
}

export async function configureRevenueCat(): Promise<void> {
  if (!isRevenueCatConfigured() || Platform.OS !== "ios") return;
  if (configured) return;

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  Purchases.configure({
    apiKey: getRevenueCatIosApiKey(),
  });
  configured = true;
}

export async function identifyRevenueCatUser(appUserId: string): Promise<void> {
  if (!isRevenueCatConfigured() || Platform.OS !== "ios") return;
  await configureRevenueCat();
  await Purchases.logIn(appUserId);
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isRevenueCatConfigured() || Platform.OS !== "ios") return null;
  await configureRevenueCat();
  return Purchases.getCustomerInfo();
}

export async function fetchMonthlyPackage(): Promise<PurchasesPackage | null> {
  if (!isRevenueCatConfigured() || Platform.OS !== "ios") return null;
  await configureRevenueCat();

  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return null;

  return (
    current.monthly ??
    current.availablePackages.find((pkg) => pkg.packageType === "MONTHLY") ??
    current.availablePackages[0] ??
    null
  );
}

export async function purchaseMonthlyPackage(
  pkg: PurchasesPackage,
): Promise<CustomerInfo> {
  if (!isRevenueCatConfigured() || Platform.OS !== "ios") {
    throw new Error("Subscriptions are not configured yet.");
  }
  await configureRevenueCat();
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  if (!isRevenueCatConfigured() || Platform.OS !== "ios") {
    throw new Error("Subscriptions are not configured yet.");
  }
  await configureRevenueCat();
  return Purchases.restorePurchases();
}
