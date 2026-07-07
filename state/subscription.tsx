import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import type { CustomerInfo, PurchasesPackage } from "react-native-purchases";
import Purchases from "react-native-purchases";
import {
  configureRevenueCat,
  fetchMonthlyPackage,
  getCustomerInfo,
  hasProEntitlement,
  identifyRevenueCatUser,
  purchaseMonthlyPackage,
  restorePurchases,
} from "@/lib/revenuecat";
import { isRevenueCatConfigured } from "@/lib/revenuecatConfig";
import { useAuth } from "@/state/auth";

type SubscriptionContextValue = {
  configured: boolean;
  hydrated: boolean;
  isPro: boolean;
  monthlyPackage: PurchasesPackage | null;
  priceLabel: string;
  purchasing: boolean;
  refresh: () => Promise<void>;
  purchaseMonthly: () => Promise<boolean>;
  restore: () => Promise<boolean>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

const DEFAULT_PRICE_LABEL = "$7.99 a month";

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const configured = isRevenueCatConfigured() && Platform.OS === "ios";
  const [hydrated, setHydrated] = useState(!configured);
  const [isPro, setIsPro] = useState(false);
  const [monthlyPackage, setMonthlyPackage] =
    useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const refresh = useCallback(async () => {
    if (!configured) {
      setHydrated(true);
      return;
    }

    try {
      await configureRevenueCat();
      const [info, pkg] = await Promise.all([
        getCustomerInfo(),
        fetchMonthlyPackage(),
      ]);
      if (info) setIsPro(hasProEntitlement(info));
      setMonthlyPackage(pkg);
    } finally {
      setHydrated(true);
    }
  }, [configured]);

  useEffect(() => {
    if (!configured || !user?.id) return;
    identifyRevenueCatUser(user.id).catch(() => {});
  }, [configured, user?.id]);

  useEffect(() => {
    refresh().catch(() => setHydrated(true));
  }, [refresh]);

  useEffect(() => {
    if (!configured) return;

    const listener = (info: CustomerInfo) => {
      setIsPro(hasProEntitlement(info));
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [configured]);

  const purchaseMonthly = useCallback(async () => {
    if (!monthlyPackage) {
      throw new Error(
        "Subscription isn't available yet. Finish RevenueCat + App Store setup, then rebuild the app.",
      );
    }
    setPurchasing(true);
    try {
      const info = await purchaseMonthlyPackage(monthlyPackage);
      const active = hasProEntitlement(info);
      setIsPro(active);
      return active;
    } finally {
      setPurchasing(false);
    }
  }, [monthlyPackage]);

  const restore = useCallback(async () => {
    setPurchasing(true);
    try {
      const info = await restorePurchases();
      const active = hasProEntitlement(info);
      setIsPro(active);
      return active;
    } finally {
      setPurchasing(false);
    }
  }, []);

  const priceLabel = monthlyPackage?.product.priceString
    ? `${monthlyPackage.product.priceString} a month`
    : DEFAULT_PRICE_LABEL;

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      configured,
      hydrated,
      isPro,
      monthlyPackage,
      priceLabel,
      purchasing,
      refresh,
      purchaseMonthly,
      restore,
    }),
    [
      configured,
      hydrated,
      isPro,
      monthlyPackage,
      priceLabel,
      purchasing,
      refresh,
      purchaseMonthly,
      restore,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}
