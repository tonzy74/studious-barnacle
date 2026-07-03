import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { Bottle, WhiskeyRecord } from '../types';

/**
 * The Anthropic API key lives in the platform secure enclave (iOS Keychain /
 * Android Keystore via expo-secure-store) — never in AsyncStorage, which is
 * plaintext on disk. Only non-secret collection data is persisted there.
 */
const API_KEY_KEYCHAIN_ID = 'whiskey-vault.anthropic-key';

interface VaultState {
  bottles: Bottle[];
  apiKey: string;
  /**
   * The self-improving library: records learned at runtime from barcode
   * scans, AI profiling, and manual adds. Searched and matched alongside the
   * built-in reference database, and persisted on-device. (Designed so a
   * shared sync backend can be layered on later.)
   */
  learned: WhiskeyRecord[];
  addBottle: (bottle: Bottle) => void;
  updateBottle: (id: string, patch: Partial<Bottle>) => void;
  removeBottle: (id: string) => void;
  setApiKey: (key: string) => void;
  learnRecord: (record: WhiskeyRecord) => void;
}

export const useStore = create<VaultState>()(
  persist(
    (set) => ({
      bottles: [],
      apiKey: '',
      learned: [],
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
    }),
    {
      name: 'whiskey-vault',
      storage: createJSONStorage(() => AsyncStorage),
      // Secrets are excluded from AsyncStorage persistence — the API key is
      // stored only in the Keychain/Keystore and restored on launch below.
      partialize: (s) => ({ bottles: s.bottles, learned: s.learned }) as VaultState,
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
    // Keychain unavailable (rare) — fall back to what the old blob had so
    // the feature keeps working; it will migrate on a later launch.
    if (legacyKey) useStore.setState({ apiKey: legacyKey });
  }
}

export function newBottleId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
