import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeId = "fct-green" | "successfactors" | "workday" | "teams";

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  swatch: string;
  sidebarSwatch: string;
  vars: Record<string, string>;
}

// ==========================================================
// ACCESS CONTROL — edit these two arrays to restrict choices
// ==========================================================
// Themes employees are allowed to pick. Remove IDs to hide them.
// Valid IDs: "fct-green" | "successfactors" | "workday" | "teams"
export const ENABLED_THEME_IDS: ThemeId[] = [
  "fct-green",
  "successfactors",
  "workday",
  "teams",
];

// ESS layouts employees are allowed to pick.
// Valid IDs: "classic" | "bento"
export type EssLayoutId = "classic" | "bento";
export const ENABLED_ESS_LAYOUTS: EssLayoutId[] = [
  "classic",
  "bento",
];
export const DEFAULT_ESS_LAYOUT: EssLayoutId = "classic";
// ==========================================================

export const THEMES: ThemeDefinition[] = [
  {
    id: "fct-green",
    name: "FCT Green (Default)",
    description: "Light sidebar, green accents",
    swatch: "#1FA75A",
    sidebarSwatch: "#FFFFFF",
    vars: {
      "--primary": "142 70% 40%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "140 30% 96%",
      "--secondary-foreground": "142 25% 27%",
      "--muted": "140 30% 96.1%",
      "--muted-foreground": "142 16.3% 46.9%",
      "--accent": "142 60% 94%",
      "--accent-foreground": "142 47.4% 11.2%",
      "--destructive": "0 84.2% 60.2%",
      "--destructive-foreground": "140 40% 98%",
      "--border": "140 20% 91.4%",
      "--input": "140 20% 91.4%",
      "--ring": "142 70% 40%",
      "--radius": "0.75rem",
      "--background": "0 0% 100%",
      "--foreground": "142 30% 10%",
      "--card": "0 0% 100%",
      "--card-foreground": "142 30% 10%",
      "--font-sans": "'Inter', sans-serif",
      "--font-display": "'Playfair Display', serif",
      "--sidebar-bg": "0 0% 100%",
      "--sidebar-fg": "222 47% 11%",
      "--sidebar-fg-muted": "215 20% 35%",
      "--sidebar-border": "214 32% 91%",
      "--sidebar-hover-bg": "210 40% 96%",
      "--sidebar-active-bg": "142 60% 94%",
      "--sidebar-active-fg": "142 70% 40%",
      "--sidebar-section": "215 20% 55%",
      "--sidebar-icon": "215 20% 65%",
      "--sidebar-footer-bg": "210 40% 98%",
    },
  },
  {
    id: "successfactors",
    name: "SAP SuccessFactors",
    description: "Clean light sidebar, enterprise blue",
    swatch: "#0070F2",
    sidebarSwatch: "#F8FAFC",
    vars: {
      "--primary": "212 100% 42%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "210 40% 96%",
      "--secondary-foreground": "215 25% 27%",
      "--muted": "210 40% 96%",
      "--muted-foreground": "215 16% 47%",
      "--accent": "212 95% 95%",
      "--accent-foreground": "212 100% 30%",
      "--destructive": "0 72% 51%",
      "--destructive-foreground": "0 0% 100%",
      "--border": "214 32% 91%",
      "--input": "214 32% 91%",
      "--ring": "212 100% 42%",
      "--radius": "0.25rem",
      "--background": "0 0% 100%",
      "--foreground": "215 28% 17%",
      "--card": "0 0% 100%",
      "--card-foreground": "215 28% 17%",
      "--font-sans": "'Inter', sans-serif",
      "--font-display": "'Inter', sans-serif",
      "--sidebar-bg": "210 40% 98%",
      "--sidebar-fg": "215 28% 17%",
      "--sidebar-fg-muted": "215 16% 47%",
      "--sidebar-border": "214 32% 91%",
      "--sidebar-hover-bg": "212 60% 95%",
      "--sidebar-active-bg": "212 95% 92%",
      "--sidebar-active-fg": "212 100% 35%",
      "--sidebar-section": "215 16% 55%",
      "--sidebar-icon": "215 16% 55%",
      "--sidebar-footer-bg": "210 40% 96%",
    },
  },
  {
    id: "workday",
    name: "Workday",
    description: "Dark navy sidebar, coral accent",
    swatch: "#F15A29",
    sidebarSwatch: "#1E2A3A",
    vars: {
      "--primary": "14 90% 53%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "30 25% 96%",
      "--secondary-foreground": "14 30% 25%",
      "--muted": "30 20% 95%",
      "--muted-foreground": "25 10% 45%",
      "--accent": "14 95% 95%",
      "--accent-foreground": "14 80% 35%",
      "--destructive": "0 75% 50%",
      "--destructive-foreground": "0 0% 100%",
      "--border": "30 15% 88%",
      "--input": "30 15% 88%",
      "--ring": "14 90% 53%",
      "--radius": "0.625rem",
      "--background": "30 30% 98%",
      "--foreground": "220 18% 15%",
      "--card": "0 0% 100%",
      "--card-foreground": "220 18% 15%",
      "--font-sans": "'Inter', sans-serif",
      "--font-display": "'Inter', sans-serif",
      "--sidebar-bg": "215 30% 16%",
      "--sidebar-fg": "0 0% 95%",
      "--sidebar-fg-muted": "215 15% 75%",
      "--sidebar-border": "215 25% 22%",
      "--sidebar-hover-bg": "215 30% 22%",
      "--sidebar-active-bg": "14 90% 53%",
      "--sidebar-active-fg": "0 0% 100%",
      "--sidebar-section": "215 15% 60%",
      "--sidebar-icon": "215 15% 75%",
      "--sidebar-footer-bg": "215 35% 12%",
    },
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Dark indigo sidebar, purple accent",
    swatch: "#5B5FC7",
    sidebarSwatch: "#2D2C40",
    vars: {
      "--primary": "235 70% 53%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "220 20% 96%",
      "--secondary-foreground": "235 30% 25%",
      "--muted": "220 20% 96%",
      "--muted-foreground": "220 10% 46%",
      "--accent": "235 80% 95%",
      "--accent-foreground": "235 70% 35%",
      "--destructive": "0 72% 51%",
      "--destructive-foreground": "0 0% 100%",
      "--border": "220 15% 90%",
      "--input": "220 15% 90%",
      "--ring": "235 70% 53%",
      "--radius": "0.5rem",
      "--background": "220 20% 98%",
      "--foreground": "220 25% 15%",
      "--card": "0 0% 100%",
      "--card-foreground": "220 25% 15%",
      "--font-sans": "'Inter', sans-serif",
      "--font-display": "'Inter', sans-serif",
      "--sidebar-bg": "240 18% 21%",
      "--sidebar-fg": "0 0% 95%",
      "--sidebar-fg-muted": "240 10% 75%",
      "--sidebar-border": "240 15% 28%",
      "--sidebar-hover-bg": "240 18% 28%",
      "--sidebar-active-bg": "235 70% 53%",
      "--sidebar-active-fg": "0 0% 100%",
      "--sidebar-section": "240 10% 60%",
      "--sidebar-icon": "240 10% 75%",
      "--sidebar-footer-bg": "240 20% 17%",
    },
  },
];

const DEFAULT_THEME: ThemeId = "fct-green";
const STORAGE_KEY = "hrms-theme";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: ThemeDefinition[];
  currentTheme: ThemeDefinition;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyTheme(theme: ThemeDefinition) {
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.setAttribute("data-theme", theme.id);
}

const AVAILABLE_THEMES: ThemeDefinition[] = THEMES.filter(t =>
  ENABLED_THEME_IDS.includes(t.id)
);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME;
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    const isAllowed = stored && AVAILABLE_THEMES.some(t => t.id === stored);
    if (isAllowed) return stored!;
    return AVAILABLE_THEMES.some(t => t.id === DEFAULT_THEME)
      ? DEFAULT_THEME
      : (AVAILABLE_THEMES[0]?.id ?? DEFAULT_THEME);
  });

  useEffect(() => {
    const def = THEMES.find(t => t.id === theme) ?? THEMES[0];
    applyTheme(def);
  }, [theme]);

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const currentTheme = THEMES.find(t => t.id === theme) ?? THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: AVAILABLE_THEMES, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

// ------- ESS layout helpers -------
const ESS_LAYOUT_KEY = "hrms-ess-layout";

export function getEssLayout(): EssLayoutId {
  if (typeof window === "undefined") return DEFAULT_ESS_LAYOUT;
  const stored = localStorage.getItem(ESS_LAYOUT_KEY) as EssLayoutId | null;
  if (stored && ENABLED_ESS_LAYOUTS.includes(stored)) return stored;
  return ENABLED_ESS_LAYOUTS.includes(DEFAULT_ESS_LAYOUT)
    ? DEFAULT_ESS_LAYOUT
    : ENABLED_ESS_LAYOUTS[0];
}

export function setEssLayoutStored(id: EssLayoutId) {
  if (!ENABLED_ESS_LAYOUTS.includes(id)) return;
  localStorage.setItem(ESS_LAYOUT_KEY, id);
  window.dispatchEvent(new Event("hrms-ess-layout-change"));
}

export function useEssLayout(): [EssLayoutId, (id: EssLayoutId) => void] {
  const [layout, setLayout] = useState<EssLayoutId>(() => getEssLayout());
  useEffect(() => {
    const h = () => setLayout(getEssLayout());
    window.addEventListener("hrms-ess-layout-change", h);
    return () => window.removeEventListener("hrms-ess-layout-change", h);
  }, []);
  const set = (id: EssLayoutId) => {
    setEssLayoutStored(id);
    setLayout(id);
  };
  return [layout, set];
}

export function getEssLayoutOptions() {
  return [
    { id: "classic" as const, name: "Classic Tabs" },
    { id: "bento" as const, name: "Bento Grid" },
  ].filter(o => ENABLED_ESS_LAYOUTS.includes(o.id));
}