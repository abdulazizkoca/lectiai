"use client";

import { useEffect } from "react";

export function ThemeInitializer() {
  useEffect(() => {
    // Get stored theme
    const theme = localStorage.getItem("lectio-theme") || "system";
    
    // Check system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // Determine if dark
    const isDark = theme === "dark" || (theme === "system" && prefersDark);
    
    // Apply class to HTML
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(isDark ? "dark" : "light");
    
    // Remove the hidden class from body to show content
    document.body.style.opacity = "1";
  }, []);

  return null;
}

export default ThemeInitializer;
