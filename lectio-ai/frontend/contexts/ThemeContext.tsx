"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "lectio-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme | null;
    if (stored) {
      setThemeState(stored);
    } else {
      setThemeState(defaultTheme);
    }
    setMounted(true);
  }, [defaultTheme, storageKey]);

  // Update resolved theme based on current theme and system preference
  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    
    const updateResolvedTheme = () => {
      let resolved: "dark" | "light";
      
      if (theme === "system") {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      } else {
        resolved = theme;
      }
      
      setResolvedTheme(resolved);
      
      // Update HTML class
      root.classList.remove("dark", "light");
      root.classList.add(resolved);
      
      // Update CSS variables
      if (resolved === "dark") {
        root.style.setProperty("--background", "#0A0A0F");
        root.style.setProperty("--foreground", "#ffffff");
        root.style.setProperty("--card", "#18181F");
        root.style.setProperty("--card-foreground", "#ffffff");
        root.style.setProperty("--border", "#27272A");
        root.style.setProperty("--input", "#27272A");
        root.style.setProperty("--primary", "#F5A623");
        root.style.setProperty("--primary-foreground", "#000000");
        root.style.setProperty("--secondary", "#27272A");
        root.style.setProperty("--secondary-foreground", "#ffffff");
        root.style.setProperty("--muted", "#27272A");
        root.style.setProperty("--muted-foreground", "#A1A1AA");
        root.style.setProperty("--accent", "#1B4FD8");
        root.style.setProperty("--accent-foreground", "#ffffff");
        root.style.setProperty("--destructive", "#EF4444");
        root.style.setProperty("--destructive-foreground", "#ffffff");
        root.style.setProperty("--success", "#22C55E");
        root.style.setProperty("--success-foreground", "#000000");
        root.style.setProperty("--warning", "#EAB308");
        root.style.setProperty("--warning-foreground", "#000000");
        root.style.setProperty("--info", "#3B82F6");
        root.style.setProperty("--info-foreground", "#ffffff");
      } else {
        root.style.setProperty("--background", "#ffffff");
        root.style.setProperty("--foreground", "#0A0A0F");
        root.style.setProperty("--card", "#f8f8f8");
        root.style.setProperty("--card-foreground", "#0A0A0F");
        root.style.setProperty("--border", "#E4E4E7");
        root.style.setProperty("--input", "#E4E4E7");
        root.style.setProperty("--primary", "#F5A623");
        root.style.setProperty("--primary-foreground", "#000000");
        root.style.setProperty("--secondary", "#F4F4F5");
        root.style.setProperty("--secondary-foreground", "#0A0A0F");
        root.style.setProperty("--muted", "#F4F4F5");
        root.style.setProperty("--muted-foreground", "#71717A");
        root.style.setProperty("--accent", "#1B4FD8");
        root.style.setProperty("--accent-foreground", "#ffffff");
        root.style.setProperty("--destructive", "#EF4444");
        root.style.setProperty("--destructive-foreground", "#ffffff");
        root.style.setProperty("--success", "#22C55E");
        root.style.setProperty("--success-foreground", "#ffffff");
        root.style.setProperty("--warning", "#EAB308");
        root.style.setProperty("--warning-foreground", "#000000");
        root.style.setProperty("--info", "#3B82F6");
        root.style.setProperty("--info-foreground", "#ffffff");
      }
    };

    updateResolvedTheme();

    // Listen for system theme changes
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => updateResolvedTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, mounted]);

  // Set theme and persist to localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };

  // Toggle between dark and light
  const toggleTheme = () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        toggleTheme,
        isDark: resolvedTheme === "dark",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export type { Theme };
