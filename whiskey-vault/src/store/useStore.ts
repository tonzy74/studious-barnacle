import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { Bottle } from '../types';

interface VaultState {
  bottles: Bottle[];
  apiKey: string;
  addBottle: (bottle: Bottle) => void;
  updateBottle: (id: string, patch: Partial<Bottle>) => void;
  removeBottle: (id: string) => void;
  setApiKey: (key: string) => void;
}

export const useStore = create<VaultState>()(
  persist(
    (set) => ({
      bottles: [],
      apiKey: '',
      addBottle: (bottle) => set((s) => ({ bottles: [bottle, ...s.bottles] })),
      updateBottle: (id, patch) =>
        set((s) => ({
          bottles: s.bottles.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      removeBottle: (id) => set((s) => ({ bottles: s.bottles.filter((b) => b.id !== id) })),
      setApiKey: (apiKey) => set({ apiKey }),
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
