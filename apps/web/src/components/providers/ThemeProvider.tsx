"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  applyTheme,
  CODING_VIBE_THEME,
  getThemeMode,
  loadUserTheme,
  loadThemeFromStorage,
  resolveSystemTheme,
  saveThemeToStorage,
  setThemeMode,
  type ThemeConfig,
} from "@/lib/theme";

interface ThemeContextValue {
  currentTheme: ThemeConfig;
  setTheme: (colors: Record<string, string>) => void;
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export function ThemeProvider({ children, userId }: ThemeProviderProps) {
  // Initialize from storage or system if possible, but keep it stable for hydration
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>({
    name: CODING_VIBE_THEME.name,
    colors: { ...CODING_VIBE_THEME.colors },
  });

  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // 1. Initial local apply
    const stored = loadThemeFromStorage();
    const mode = getThemeMode();
    
    if (stored && mode !== "system") {
      applyTheme(stored);
      setCurrentTheme({ name: "custom", colors: stored });
    } else {
      const systemTheme = resolveSystemTheme();
      applyTheme(systemTheme.colors);
      setCurrentTheme(systemTheme);
      if (!mode) setThemeMode("system");
    }
    
    setHasHydrated(true);

    // 2. Background sync with DB
    if (userId) {
      loadUserTheme().then((colors) => {
        if (colors) {
          // If the DB theme is different from what we have, it will apply via loadUserTheme
          // and we just need to update the React state.
          setCurrentTheme({ name: "custom", colors });
        }
      });
    }
  }, [userId]);

  // setTheme applies immediately, updates state, and persists to localStorage.
  const setTheme = useCallback((colors: Record<string, string>) => {
    applyTheme(colors);
    saveThemeToStorage(colors);
    setThemeMode("custom");
    setCurrentTheme({
      name: "custom",
      colors,
    });
  }, []);

  const resetToDefault = useCallback(() => {
    const defaults = CODING_VIBE_THEME.colors as Record<string, string>;
    applyTheme(defaults);
    saveThemeToStorage(defaults);
    setThemeMode("system");
    setCurrentTheme({ name: CODING_VIBE_THEME.name, colors: { ...defaults } });
  }, []);

  // Prevent hydration mismatch by only rendering themed components after mount
  // or by ensuring the initial state matches the server-side default.
  // We use suppressHydrationWarning on the html tag to allow the script to change styles.

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, resetToDefault }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

