// src/store/useThemeStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useThemeStore = create(
  persist(
    (set) => ({
      isDark: true,
      toggleTheme: () => set((s) => ({ isDark: !s.isDark })),
      setDark: (val) => set({ isDark: val }),
    }),
    {
      name: 'fitrax-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useThemeStore;
