"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type ThemeId = "neon-dusk" | "midnight" | "solar" | "emerald" | "crimson" | "pearl-light";

export interface Theme {
  id: ThemeId;
  name: string;
  /** CSS variables to inject into <html> */
  vars: Record<string, string>;
  /** Visual swatch for the picker */
  swatch: string; // CSS gradient string
  isLight?: boolean;
}

export const THEMES: Theme[] = [
  {
    id: "neon-dusk",
    name: "Neon Dusk",
    swatch: "linear-gradient(135deg, #FF4FD8, #C96CFF, #72B7FF)",
    vars: {
      "--brand-1": "#FF4FD8",
      "--brand-2": "#C96CFF",
      "--brand-3": "#72B7FF",
      "--brand-4": "#FFB347",
      "--glow-rgb": "255, 79, 216",
      "--aurora-1": "#FF4FD8",
      "--aurora-2": "#72B7FF",
      "--aurora-3": "#C96CFF",
      "--aurora-4": "#FFB347",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    swatch: "linear-gradient(135deg, #00D4FF, #0099FF, #005BEA)",
    vars: {
      "--brand-1": "#00D4FF",
      "--brand-2": "#0099FF",
      "--brand-3": "#005BEA",
      "--brand-4": "#003ACC",
      "--glow-rgb": "0, 212, 255",
      "--aurora-1": "#00D4FF",
      "--aurora-2": "#005BEA",
      "--aurora-3": "#0099FF",
      "--aurora-4": "#003ACC",
    },
  },
  {
    id: "solar",
    name: "Solar",
    swatch: "linear-gradient(135deg, #FF6B00, #FF9A3C, #FFD700)",
    vars: {
      "--brand-1": "#FF6B00",
      "--brand-2": "#FF9A3C",
      "--brand-3": "#FFD700",
      "--brand-4": "#FF3D00",
      "--glow-rgb": "255, 107, 0",
      "--aurora-1": "#FF6B00",
      "--aurora-2": "#FFD700",
      "--aurora-3": "#FF9A3C",
      "--aurora-4": "#FF3D00",
    },
  },
  {
    id: "emerald",
    name: "Emerald",
    swatch: "linear-gradient(135deg, #00FF87, #00D4A3, #00A3FF)",
    vars: {
      "--brand-1": "#00FF87",
      "--brand-2": "#00D4A3",
      "--brand-3": "#00A3FF",
      "--brand-4": "#00C853",
      "--glow-rgb": "0, 255, 135",
      "--aurora-1": "#00FF87",
      "--aurora-2": "#00A3FF",
      "--aurora-3": "#00D4A3",
      "--aurora-4": "#00C853",
    },
  },
  {
    id: "crimson",
    name: "Crimson",
    swatch: "linear-gradient(135deg, #FF1744, #FF6D00, #FF9100)",
    vars: {
      "--brand-1": "#FF1744",
      "--brand-2": "#FF4500",
      "--brand-3": "#FF9100",
      "--brand-4": "#FF6D00",
      "--glow-rgb": "255, 23, 68",
      "--aurora-1": "#FF1744",
      "--aurora-2": "#FF9100",
      "--aurora-3": "#FF4500",
      "--aurora-4": "#FF6D00",
    },
  },
  {
    id: "pearl-light",
    name: "Pearl Light",
    isLight: true,
    swatch: "linear-gradient(135deg, #FF4FD8, #72B7FF, #FFFFFF)",
    vars: {
      "--brand-1": "#FF4FD8",
      "--brand-2": "#C96CFF",
      "--brand-3": "#72B7FF",
      "--brand-4": "#FFB347",
      "--glow-rgb": "255, 79, 216",
      "--aurora-1": "#FF4FD8",
      "--aurora-2": "#72B7FF",
      "--aurora-3": "#C96CFF",
      "--aurora-4": "#FFB347",
    },
  },
];

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  for (const [prop, val] of Object.entries(theme.vars)) {
    root.style.setProperty(prop, val);
  }
  root.setAttribute("data-theme", theme.id);
  if (theme.isLight) {
    root.classList.remove("dark");
  } else {
    root.classList.add("dark");
  }
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES[0],
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(THEMES[0]);

  // On mount: read saved theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hx-theme") as ThemeId | null;
    const found = THEMES.find((t) => t.id === saved) ?? THEMES[0];
    setThemeState(found);
    applyTheme(found);
  }, []);

  function setTheme(id: ThemeId) {
    const found = THEMES.find((t) => t.id === id) ?? THEMES[0];
    setThemeState(found);
    applyTheme(found);
    localStorage.setItem("hx-theme", id);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
