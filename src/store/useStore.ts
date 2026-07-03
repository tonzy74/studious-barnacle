import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { Bottle, WhiskeyRecord } from '../types';

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
      setApiKey: (apiKey) => set({ apiKey }),
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
    }
  )
);

export function newBottleId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
