// src/context/ThemeContext.js
import React, { createContext, useContext } from 'react';
import useThemeStore from '../store/useThemeStore';
import { getColors } from '../theme/colors';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { isDark, toggleTheme } = useThemeStore();
  const colors = getColors(isDark);
  return (
    <ThemeContext.Provider value={{ colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Use in any screen: const { colors, isDark, toggleTheme } = useTheme(); */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
