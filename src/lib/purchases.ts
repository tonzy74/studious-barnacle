/**
 * In-app purchase seam.
 *
 * Real subscriptions require StoreKit (iOS) — a native module that does NOT
 * run in Expo Go. So this module ships a JS stub that unlocks Pro locally for
 * development/testing, and is structured to swap in RevenueCat
 * (`react-native-purchases`) on your EAS/dev build with almost no UI change.
 *
 * To go live:
 *   1. Create the subscription + lifetime products in App Store Connect.
 *   2. `npx expo install react-native-purchases` (needs an EAS/dev build).
 *   3. Configure RevenueCat, then implement configureRevenueCat/purchase/
 *      restore below against its SDK. Set PURCHASES_READY = true.
 * The paywall, entitlement state, and gating are all already wired.
 */

export const PURCHASES_READY = false;

export interface PurchaseResult {
  success: boolean;
  /** True when Pro is now active. */
  pro: boolean;
  message?: string;
}

/**
 * Attempt to purchase a plan. In stub mode this simulates a successful
 * sandbox purchase so you can exercise the gated UI. On the EAS build with
 * RevenueCat wired, call `Purchases.purchasePackage(pkg)` and derive `pro`
 * from the returned entitlements.
 */
export async function purchasePro(packageId: string): Promise<PurchaseResult> {
  if (!PURCHASES_READY) {
    return {
      success: true,
      pro: true,
      message: `Sandbox unlock (${packageId}). Real billing activates once RevenueCat is wired on your build.`,
    };
  }
  // EAS build:
  //   const offerings = await Purchases.getOfferings();
  //   const pkg = offerings.current?.availablePackages.find(p => p.identifier === packageId);
  //   const { customerInfo } = await Purchases.purchasePackage(pkg);
  //   return { success: true, pro: !!customerInfo.entitlements.active['pro'], pro: ... };
  throw new Error('RevenueCat not implemented — see src/lib/purchases.ts');
}

/** Restore prior purchases (required by App Review). */
export async function restorePurchases(): Promise<PurchaseResult> {
  if (!PURCHASES_READY) {
    return { success: true, pro: true, message: 'Sandbox restore.' };
  }
  // const customerInfo = await Purchases.restorePurchases();
  // return { success: true, pro: !!customerInfo.entitlements.active['pro'] };
  throw new Error('RevenueCat not implemented — see src/lib/purchases.ts');
}

/**
 * Refresh entitlement at launch (call from App). In stub mode this is a
 * no-op; with RevenueCat, read `customerInfo.entitlements.active['pro']`.
 */
export async function refreshEntitlement(): Promise<boolean | undefined> {
  if (!PURCHASES_READY) return undefined;
  return undefined;
}
