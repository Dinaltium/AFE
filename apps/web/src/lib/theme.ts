export const LIGHT_DEFAULT_THEME = {
  name: "light",
  colors: {
    "accent": "#F0FFF7",
    "accent-foreground": "#00AA66",
    "background": "#FFFFFF",
    "border": "#E5E7EB",
    "card": "#F9FAFB",
    "card-foreground": "#111827",
    "destructive": "#DC2626",
    "destructive-foreground": "#FFFFFF",
    "foreground": "#111827",
    "input": "#F3F4F6",
    "muted": "#F3F4F6",
    "muted-foreground": "#6B7280",
    "popover": "#FFFFFF",
    "popover-foreground": "#111827",
    "primary": "#00CC7A",
    "primary-foreground": "#FFFFFF",
    "ring": "#00CC7A",
    "ring-3": "#00CC7A",
    "secondary": "#F3F4F6",
    "secondary-foreground": "#111827",
    "sidebar-accent": "#00CC7A",
    "sidebar-accent-foreground": "#FFFFFF",
    "sidebar-background": "#F9FAFB",
    "sidebar-border": "#E5E7EB",
    "sidebar-foreground": "#111827",
    "sidebar-primary": "#00CC7A",
    "sidebar-primary-foreground": "#FFFFFF",
    "sidebar-ring": "#00CC7A",
    "header-accent": "#00CC7A",
    "header-accent-foreground": "#FFFFFF",
    "header-background": "#FFFFFF",
    "header-border": "#E5E7EB",
    "header-foreground": "#111827",
    "header-primary": "#00CC7A",
    "header-primary-foreground": "#FFFFFF",
    "header-ring": "#00CC7A"
  },
} as const;

export const CODING_VIBE_THEME = {
  name: "coding vibe theme",
  colors: {
    "accent": "#1E1E2E",
    "accent-foreground": "#D9F99D",
    "background": "#0D0D0D",
    "border": "#2A2A2A",
    "card": "#111111",
    "card-foreground": "#EDEDED",
    "destructive": "#FF4C4C",
    "destructive-foreground": "#FFFFFF",
    "foreground": "#EDEDED",
    "input": "#1F1F1F",
    "muted": "#202020",
    "muted-foreground": "#8B8B8B",
    "popover": "#111111",
    "popover-foreground": "#EDEDED",
    "primary": "#00FF9C",
    "primary-foreground": "#0D0D0D",
    "ring": "#00FF9C",
    "ring-3": "#00FF9C",
    "secondary": "#1E1E1E",
    "secondary-foreground": "#EDEDED",
    "sidebar-accent": "#00FF9C",
    "sidebar-accent-foreground": "#0D0D0D",
    "sidebar-background": "#0B0B0B",
    "sidebar-border": "#2A2A2A",
    "sidebar-foreground": "#EDEDED",
    "sidebar-primary": "#00FF9C",
    "sidebar-primary-foreground": "#0D0D0D",
    "sidebar-ring": "#38BDF8",
    "header-accent": "#00FF9C",
    "header-accent-foreground": "#0D0D0D",
    "header-background": "#0D0D0D",
    "header-border": "#2A2A2A",
    "header-foreground": "#EDEDED",
    "header-primary": "#00FF9C",
    "header-primary-foreground": "#0D0D0D",
    "header-ring": "#00FF9C"
  },
} as const;

export const AMBER_MINIMAL_THEME = {
  name: "amber minimal theme",
  colors: {
    "accent": "#fdf9ec",
    "accent-foreground": "#945c2e",
    "background": "#ffffff",
    "border": "#ececf0",
    "card": "#ffffff",
    "card-foreground": "#444444",
    "destructive": "#b63a23",
    "destructive-foreground": "#ffffff",
    "foreground": "#444444",
    "input": "#ececf0",
    "muted": "#fafafa",
    "muted-foreground": "#8c8c94",
    "popover": "#ffffff",
    "popover-foreground": "#444444",
    "primary": "#fbbf24",
    "primary-foreground": "#000000",
    "ring": "#fbbf24",
    "ring-3": "#fbbf24",
    "secondary": "#f7f7fb",
    "secondary-foreground": "#726f84",
    "sidebar-accent": "#fdf9ec",
    "sidebar-accent-foreground": "#945c2e",
    "sidebar-background": "#fafafa",
    "sidebar-border": "#ececf0",
    "sidebar-foreground": "#444444",
    "sidebar-primary": "#fbbf24",
    "sidebar-primary-foreground": "#ffffff",
    "sidebar-ring": "#fbbf24",
    "header-accent": "#fdf9ec",
    "header-accent-foreground": "#945c2e",
    "header-background": "#ffffff",
    "header-border": "#ececf0",
    "header-foreground": "#8c8c94",
    "header-primary": "#fbbf24",
    "header-primary-foreground": "#000000",
    "header-ring": "#fbbf24"
  }
} as const;

export const LAVENDER_DARK_THEME = {
  name: "lavender dark theme",
  colors: {
    "accent": "#372e3f",
    "accent-foreground": "#f2b8c6",
    "background": "#1a1823",
    "border": "#302c40",
    "card": "#232030",
    "card-foreground": "#e0ddef",
    "destructive": "#e57373",
    "destructive-foreground": "#1a1823",
    "foreground": "#e0ddef",
    "input": "#2a273a",
    "muted": "#242031",
    "muted-foreground": "#a09aad",
    "popover": "#232030",
    "popover-foreground": "#e0ddef",
    "primary": "#a995c9",
    "primary-foreground": "#1a1823",
    "ring": "#a995c9",
    "ring-3": "#a995c9",
    "secondary": "#5a5370",
    "secondary-foreground": "#e0ddef",
    "sidebar-accent": "#372e3f",
    "sidebar-accent-foreground": "#f2b8c6",
    "sidebar-background": "#16141e",
    "sidebar-border": "#2a273a",
    "sidebar-foreground": "#e0ddef",
    "sidebar-primary": "#a995c9",
    "sidebar-primary-foreground": "#1a1823",
    "sidebar-ring": "#a995c9",
    "header-accent": "#372e3f",
    "header-accent-foreground": "#f2b8c6",
    "header-background": "#1a1823",
    "header-border": "#302c40",
    "header-foreground": "#a09aad",
    "header-primary": "#a995c9",
    "header-primary-foreground": "#1a1823",
    "header-ring": "#a995c9"
  }
} as const;

export type ThemeConfig = {
  name: string;
  colors: Record<string, string>;
};

const STORAGE_KEY = "afe-theme-colors";
const MODE_KEY = "afe-theme-mode";

type ThemeMode = "custom" | "system";

/**
 * Persist the full theme color map to localStorage so the blocking init
 * script can apply it synchronously before React hydrates.
 */
export function saveThemeToStorage(colors: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch {
    // Storage unavailable — silently ignore
  }
}

export function setThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Storage unavailable — silently ignore
  }
}

export function getThemeMode(): ThemeMode | null {
  try {
    const raw = localStorage.getItem(MODE_KEY);
    if (raw === "custom" || raw === "system") return raw;
    return null;
  } catch {
    return null;
  }
}

export function clearThemeStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MODE_KEY);
  } catch {
    // Storage unavailable — silently ignore
  }
}

/**
 * Read theme colors from localStorage synchronously.
 * Returns null if nothing is stored or storage is unavailable.
 */
export function loadThemeFromStorage(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch {
    return null;
  }
}

/**
 * Minified inline blocking script injected into <head> before React hydrates.
 * Reads localStorage and applies CSS vars synchronously to prevent any flash
 * of the default Coding Vibe theme when a different theme is saved.
 */
// Minified inline blocking script: runs before React hydrates.
// - Skips the landing page entirely (no theming on /)
// - Applies stored localStorage theme if present and mode is not "system"
// - Falls back to system prefers-color-scheme: dark → Coding Vibe, light → Light theme
export const THEME_INIT_SCRIPT = `(function(){try{var K='afe-theme-colors';var M='afe-theme-mode';var L={'accent':'#F0FFF7','accent-foreground':'#00AA66','background':'#FFFFFF','border':'#E5E7EB','card':'#F9FAFB','card-foreground':'#111827','destructive':'#DC2626','destructive-foreground':'#FFFFFF','foreground':'#111827','input':'#F3F4F6','muted':'#F3F4F6','muted-foreground':'#6B7280','popover':'#FFFFFF','popover-foreground':'#111827','primary':'#00CC7A','primary-foreground':'#FFFFFF','ring':'#00CC7A','ring-3':'#00CC7A','secondary':'#F3F4F6','secondary-foreground':'#111827','sidebar-accent':'#00CC7A','sidebar-accent-foreground':'#FFFFFF','sidebar-background':'#F9FAFB','sidebar-border':'#E5E7EB','sidebar-foreground':'#111827','sidebar-primary':'#00CC7A','sidebar-primary-foreground':'#FFFFFF','sidebar-ring':'#00CC7A','header-background':'#FFFFFF','header-border':'#E5E7EB','header-foreground':'#111827'};var D={'accent':'#1E1E2E','accent-foreground':'#D9F99D','background':'#0D0D0D','border':'#2A2A2A','card':'#111111','card-foreground':'#EDEDED','destructive':'#FF4C4C','destructive-foreground':'#FFFFFF','foreground':'#EDEDED','input':'#1F1F1F','muted':'#202020','muted-foreground':'#8B8B8B','popover':'#111111','popover-foreground':'#EDEDED','primary':'#00FF9C','primary-foreground':'#0D0D0D','ring':'#00FF9C','ring-3':'#00FF9C','secondary':'#1E1E1E','secondary-foreground':'#EDEDED','sidebar-accent':'#00FF9C','sidebar-accent-foreground':'#0D0D0D','sidebar-background':'#0B0B0B','sidebar-border':'#2A2A2A','sidebar-foreground':'#EDEDED','sidebar-primary':'#00FF9C','sidebar-primary-foreground':'#0D0D0D','sidebar-ring':'#38BDF8','header-background':'#0D0D0D','header-border':'#2A2A2A','header-foreground':'#EDEDED'};function h(x){var r=parseInt(x.slice(1,3),16)/255,g=parseInt(x.slice(3,5),16)/255,b=parseInt(x.slice(5,7),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),hh=0,s=0,l=(mx+mn)/2;if(mx!==mn){var d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);if(mx===r)hh=((g-b)/d+(g<b?6:0))/6;else if(mx===g)hh=((b-r)/d+2)/6;else hh=((r-g)/d+4)/6;}return Math.round(hh*360)+' '+Math.round(s*100)+'% '+Math.round(l*100)+'%';}function a(c){var el=document.documentElement;for(var k in c){var v=c[k];if(v&&v[0]==='#')el.style.setProperty('--'+k,h(v));else if(v)el.style.setProperty('--'+k,v);}if(!c['header-background']&&c['background'])el.style.setProperty('--header-background',h(c['background']));if(!c['header-border']&&c['border'])el.style.setProperty('--header-border',h(c['border']));}var mode=localStorage.getItem(M);var stored=JSON.parse(localStorage.getItem(K)||'null');if(stored&&mode!=='system'){a(stored);return;}var dark=window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches;a(dark?D:L);}catch(e){}})();`;

export function resolveSystemTheme(): ThemeConfig {
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const defaults = prefersDark ? CODING_VIBE_THEME : LIGHT_DEFAULT_THEME;
  return { name: defaults.name, colors: { ...defaults.colors } };
}

/**
 * Convert a hex color string like "#00FF9C" to HSL format "153 100% 50%"
 * used by CSS custom properties in shadcn/ui.
 */
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Apply a theme color map to document.documentElement CSS variables.
 * Hex values are converted to HSL format for shadcn's CSS variable system.
 */
export function applyTheme(colors: Record<string, string>): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(colors)) {
    if (value.startsWith("#")) {
      root.style.setProperty(`--${key}`, hexToHsl(value));
    } else {
      root.style.setProperty(`--${key}`, value);
    }
  }

  // Backfill missing tokens for older saved themes to prevent dark header on light theme
  if (!colors["header-background"] && colors["background"]) {
    root.style.setProperty("--header-background", hexToHsl(colors["background"]));
  }
  if (!colors["header-border"] && colors["border"]) {
    root.style.setProperty("--header-border", hexToHsl(colors["border"]));
  }
  if (!colors["header-foreground"] && colors["foreground"]) {
    root.style.setProperty("--header-foreground", hexToHsl(colors["foreground"]));
  }
  if (!colors["ring-3"] && colors["primary"]) {
    root.style.setProperty("--ring-3", hexToHsl(colors["primary"]));
  }
}

/**
 * Fetch the user's saved theme from the API, apply it, and sync localStorage.
 * Returns the applied colors so the caller can update React state, or null if
 * nothing is saved.
 */
export async function loadUserTheme(): Promise<Record<string, string> | null> {
  try {
    const res = await fetch("/api/user/theme");
    if (!res.ok) return null;
    const data = (await res.json()) as {
      themeConfig?: {
        active?: Record<string, string>;
        colors?: Record<string, string>; // legacy format
      } | null;
    };
    const colors = data.themeConfig?.active ?? data.themeConfig?.colors;
    if (colors) {
      applyTheme(colors);
      saveThemeToStorage(colors);
      setThemeMode("custom");
      return colors;
    }
    return null;
  } catch {
    return null;
  }
}
