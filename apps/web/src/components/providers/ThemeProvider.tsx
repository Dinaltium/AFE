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
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>({
    name: CODING_VIBE_THEME.name,
    colors: { ...CODING_VIBE_THEME.colors },
  });

  useEffect(() => {
    // 1. Apply stored theme only when user explicitly chose a custom theme.
    const stored = loadThemeFromStorage();
    const mode = getThemeMode();
    if (stored && mode !== "system") {
      applyTheme(stored);
      setCurrentTheme({ name: "custom", colors: stored });
    } else {
      const systemTheme = resolveSystemTheme();
      applyTheme(systemTheme.colors);
      setCurrentTheme(systemTheme);
      setThemeMode("system");
    }

    // 2. Fetch from DB in the background to keep devices in sync.
    if (userId) {
      loadUserTheme().then((colors) => {
        if (colors) {
          setCurrentTheme({ name: "custom", colors });
        } else {
          setThemeMode("system");
        }
      });
    }
  }, [userId]);

  // setTheme applies immediately, updates state, and persists to localStorage.
  const setTheme = useCallback((colors: Record<string, string>) => {
    applyTheme(colors);
    saveThemeToStorage(colors);
    setThemeMode("custom");
    setCurrentTheme((prev) => ({
      ...prev,
      colors: { ...prev.colors, ...colors },
    }));
  }, []);

  const resetToDefault = useCallback(() => {
    const defaults = CODING_VIBE_THEME.colors as Record<string, string>;
    applyTheme(defaults);
    saveThemeToStorage(defaults);
    setThemeMode("custom");
    setCurrentTheme({ name: CODING_VIBE_THEME.name, colors: { ...defaults } });
  }, []);

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
