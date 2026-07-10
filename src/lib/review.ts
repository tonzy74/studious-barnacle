import * as StoreReview from 'expo-store-review';

import { diag } from './diagnostics';

/**
 * Native wrapper for the in-app review prompt (Apple SKStoreReviewController /
 * Android In-App Review). Kept separate from reviewPolicy.ts so the decision
 * logic stays unit-testable without pulling native code. Fully guarded.
 */
export async function requestAppReview(): Promise<void> {
  try {
    if ((await StoreReview.isAvailableAsync()) && (await StoreReview.hasAction())) {
      await StoreReview.requestReview();
    }
  } catch (err) {
    diag.warn('review', `review prompt failed: ${(err as Error).message}`);
  }
}
