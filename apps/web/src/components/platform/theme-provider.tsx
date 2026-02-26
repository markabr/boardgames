"use client";

import { useEffect } from "react";
import { useCosmeticsStore } from "@/lib/stores/cosmetics-store";
import { THEMES } from "@railbound/game-logic/shared";

const THEME_CSS_MAP: Record<string, Record<string, string>> = {
  "theme-default": {
    "--accent": "#92400E",
    "--accent-light": "#B45309",
    "--accent-bg": "#FEF3C7",
  },
  "theme-midnight": {
    "--accent": "#1E40AF",
    "--accent-light": "#3B82F6",
    "--accent-bg": "#DBEAFE",
  },
  "theme-forest": {
    "--accent": "#166534",
    "--accent-light": "#22C55E",
    "--accent-bg": "#DCFCE7",
  },
  "theme-sunset": {
    "--accent": "#C2410C",
    "--accent-light": "#F97316",
    "--accent-bg": "#FFF7ED",
  },
  "theme-royal": {
    "--accent": "#7C3AED",
    "--accent-light": "#A78BFA",
    "--accent-bg": "#EDE9FE",
  },
  "theme-obsidian": {
    "--accent": "#3F3F46",
    "--accent-light": "#71717A",
    "--accent-bg": "#27272A",
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const equippedTheme = useCosmeticsStore((s) => s.equippedTheme);

  useEffect(() => {
    const vars = THEME_CSS_MAP[equippedTheme] || THEME_CSS_MAP["theme-default"];
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
  }, [equippedTheme]);

  return <>{children}</>;
}
