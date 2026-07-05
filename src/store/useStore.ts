import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  AnalyticsEvent,
  Bottle,
  ConsentSettings,
  Correction,
  Pour,
  UserProfile,
  ValueSnapshot,
  WhiskeyRecord,
  WhiskeyType,
  WishlistItem,
} from '../types';
import { upsertCorrection } from '../lib/corrections';
import {
  AnalyticsEventName,
  buildEvent,
  MAX_QUEUED_EVENTS,
  newAnonId,
} from '../lib/analyticsCore';
import { DEFAULT_MODEL } from '../lib/models';

/**
 * The Anthropic API key lives in the platform secure enclave (iOS Keychain /
 * Android Keystore via expo-secure-store) — never in AsyncStorage, which is
 * plaintext on disk. Only non-secret collection data is persisted there.
 */
const API_KEY_KEYCHAIN_ID = 'whiskey-vault.anthropic-key';

interface VaultState {
  bottles: Bottle[];
  apiKey: string;
  /** Which Claude model the AI features call (see src/lib/models.ts). */
  model: string;
  /**
   * The self-improving library: records learned at runtime from barcode
   * scans, AI profiling, and manual adds. Searched and matched alongside the
   * built-in reference database, and persisted on-device. (Designed so a
   * shared sync backend can be layered on later.)
   */
  learned: WhiskeyRecord[];
  /** Pro entitlement (cached; source of truth is the store/RevenueCat at launch). */
  isPro: boolean;
  /** Learned AI-misread → correct-identity mappings; auto-applied to future scans. */
  corrections: Correction[];
  /** Tasting journal — dated, rated pours. */
  pours: Pour[];
  /** Bottles the user is hunting for. */
  wishlist: WishlistItem[];
  /** Collection-value history for the portfolio trend. */
  valueHistory: ValueSnapshot[];
  profile: UserProfile | null;
  consent: ConsentSettings;
  /** Anonymized, consent-gated event queue (flushed to a backend one day). */
  events: AnalyticsEvent[];
  anonId: string;
  addBottle: (bottle: Bottle) => void;
  updateBottle: (id: string, patch: Partial<Bottle>) => void;
  removeBottle: (id: string) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setPro: (isPro: boolean) => void;
  learnRecord: (record: WhiskeyRecord) => void;
  /** Remember a user's fix of an AI misread so it's auto-applied next time. */
  recordCorrection: (
    original: { name: string; distillery: string },
    fixed: { name: string; distillery: string; type: WhiskeyType; proof?: number }
  ) => void;
  addPour: (pour: Pour) => void;
  removePour: (id: string) => void;
  addWishlist: (item: WishlistItem) => void;
  removeWishlist: (id: string) => void;
  /** Append today's collection-value snapshot (once per day, deduped). */
  snapshotValue: (value: number, bottles: number) => void;
  setProfile: (profile: UserProfile | null) => void;
  setConsent: (patch: Partial<ConsentSettings>) => void;
  /** No-op unless the user has opted in to analytics. */
  track: (name: AnalyticsEventName, props?: Record<string, unknown>) => void;
  /** GDPR/CCPA erasure: wipes collection, profile, events, learned library. */
  clearAllData: () => void;
}

export const useStore = create<VaultState>()(
  persist(
    (set) => ({
      bottles: [],
      apiKey: '',
      model: DEFAULT_MODEL,
      isPro: false,
      learned: [],
      corrections: [],
      pours: [],
      wishlist: [],
      valueHistory: [],
      profile: null,
      consent: { analytics: false, sellShare: false },
      events: [],
      anonId: newAnonId(),
      addBottle: (bottle) => set((s) => ({ bottles: [bottle, ...s.bottles] })),
      updateBottle: (id, patch) =>
        set((s) => ({
          bottles: s.bottles.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      removeBottle: (id) => set((s) => ({ bottles: s.bottles.filter((b) => b.id !== id) })),
      setApiKey: (apiKey) => {
        // Keychain write is fire-and-forget; state is the source of truth
        // for the session and the Keychain restores it on next launch.
        if (apiKey) {
          SecureStore.setItemAsync(API_KEY_KEYCHAIN_ID, apiKey).catch(() => {});
        } else {
          SecureStore.deleteItemAsync(API_KEY_KEYCHAIN_ID).catch(() => {});
        }
        set({ apiKey });
      },
      setModel: (model) => set({ model }),
      setPro: (isPro) => set({ isPro }),
      recordCorrection: (original, fixed) =>
        set((s) => ({ corrections: upsertCorrection(s.corrections, original, fixed) })),
      addPour: (pour) => set((s) => ({ pours: [pour, ...s.pours] })),
      removePour: (id) => set((s) => ({ pours: s.pours.filter((p) => p.id !== id) })),
      addWishlist: (item) => set((s) => ({ wishlist: [item, ...s.wishlist] })),
      removeWishlist: (id) => set((s) => ({ wishlist: s.wishlist.filter((w) => w.id !== id) })),
      snapshotValue: (value, bottles) =>
        set((s) => {
          const dayMs = 86_400_000;
          const last = s.valueHistory[s.valueHistory.length - 1];
          // One snapshot per calendar day; overwrite the same day's point.
          if (last && Math.floor(last.at / dayMs) === Math.floor(Date.now() / dayMs)) {
            const copy = s.valueHistory.slice(0, -1);
            return { valueHistory: [...copy, { at: Date.now(), value, bottles }] };
          }
          return {
            valueHistory: [...s.valueHistory, { at: Date.now(), value, bottles }].slice(-365),
          };
        }),
      learnRecord: (record) =>
        set((s) => {
          const existing = s.learned.find((r) => r.id === record.id);
          if (!existing) return { learned: [...s.learned, record] };
          // Merge: accumulate barcodes, prefer newest metadata.
          const merged: WhiskeyRecord = {
            ...existing,
            ...record,
            barcodes: [...new Set([...(existing.barcodes ?? []), ...(record.barcodes ?? [])])],
          };
          return { learned: s.learned.map((r) => (r.id === record.id ? merged : r)) };
        }),
      setProfile: (profile) => set({ profile }),
      setConsent: (patch) =>
        set((s) => {
          const next: Partial<VaultState> = {
            consent: { ...s.consent, ...patch, decidedAt: Date.now() },
          };
          // Withdrawing consent stops processing of what was collected:
          // purge the queue and rotate the anon ID so a later re-opt-in
          // isn't linkable to the prior corpus (GDPR withdrawal semantics).
          if (patch.analytics === false) {
            next.events = [];
            next.anonId = newAnonId();
          }
          return next;
        }),
      track: (name, props = {}) =>
        set((s) => {
          if (!s.consent.analytics) return s;
          const event = buildEvent(name, props, s.anonId);
          if (!event) return s;
          return { events: [...s.events.slice(-(MAX_QUEUED_EVENTS - 1)), event] };
        }),
      clearAllData: () => {
        SecureStore.deleteItemAsync(API_KEY_KEYCHAIN_ID).catch(() => {});
        SecureStore.deleteItemAsync('whiskey-vault.identity-token').catch(() => {});
        set({
          bottles: [],
          apiKey: '',
          model: DEFAULT_MODEL,
          learned: [],
          corrections: [],
          pours: [],
          wishlist: [],
          valueHistory: [],
          profile: null,
          consent: { analytics: false, sellShare: false, decidedAt: Date.now() },
          events: [],
          anonId: newAnonId(),
        });
      },
    }),
    {
      name: 'whiskey-vault',
      storage: createJSONStorage(() => AsyncStorage),
      // Secrets are excluded from AsyncStorage persistence — the API key is
      // stored only in the Keychain/Keystore and restored on launch below.
      partialize: (s) =>
        ({
          bottles: s.bottles,
          model: s.model,
          isPro: s.isPro,
          learned: s.learned,
          corrections: s.corrections,
          pours: s.pours,
          wishlist: s.wishlist,
          valueHistory: s.valueHistory,
          profile: s.profile,
          consent: s.consent,
          events: s.events,
          anonId: s.anonId,
        }) as VaultState,
      onRehydrateStorage: () => (state) => {
        void restoreApiKey(state?.apiKey);
      },
    }
  )
);

/**
 * Restore the API key from the Keychain on launch. `legacyKey` is a key found
 * in an old AsyncStorage blob (pre-Keychain installs) — it gets migrated into
 * the Keychain here and scrubbed from AsyncStorage by the next persisted
 * write (which excludes it via partialize).
 */
async function restoreApiKey(legacyKey?: string): Promise<void> {
  try {
    if (legacyKey) {
      await SecureStore.setItemAsync(API_KEY_KEYCHAIN_ID, legacyKey);
    }
    const stored = (await SecureStore.getItemAsync(API_KEY_KEYCHAIN_ID)) ?? legacyKey ?? '';
    // Setting state triggers a persisted write, which scrubs any legacy
    // plaintext key out of AsyncStorage.
    useStore.setState({ apiKey: stored });
  } catch {
    // Keychain unavailable (rare). Keep the key working in memory and retry
    // the Keychain write once — if that also fails, the worst case is the
    // user re-enters the key (never silent plaintext retention).
    if (legacyKey) {
      SecureStore.setItemAsync(API_KEY_KEYCHAIN_ID, legacyKey).catch(() => {});
      useStore.setState({ apiKey: legacyKey });
    }
  }
}

export function newBottleId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
