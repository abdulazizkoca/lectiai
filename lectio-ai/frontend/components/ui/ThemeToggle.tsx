"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, Theme } from "@/contexts/ThemeContext";

interface ThemeToggleProps {
  variant?: "switch" | "button" | "dropdown";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({
  variant = "switch",
  size = "md",
  showLabel = false,
  className = "",
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme, toggleTheme, isDark } = useTheme();

  const sizeClasses = {
    sm: {
      switch: "w-12 h-6",
      button: "w-8 h-8",
      icon: 16,
    },
    md: {
      switch: "w-14 h-7",
      button: "w-10 h-10",
      icon: 20,
    },
    lg: {
      switch: "w-16 h-8",
      button: "w-12 h-12",
      icon: 24,
    },
  };

  // Switch variant - Animated toggle switch
  if (variant === "switch") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {showLabel && (
          <span className="text-sm font-medium text-[var(--muted-foreground)]">
            {isDark ? "Tungi rejim" : "Kunduzgi rejim"}
          </span>
        )}
        
        <button
          onClick={toggleTheme}
          className={`
            ${sizeClasses[size].switch}
            relative rounded-full p-1
            transition-colors duration-300 ease-in-out
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]
            ${isDark 
              ? "bg-[var(--accent)]" 
              : "bg-[var(--muted)]"
            }
          `}
          aria-label={isDark ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
        >
          <motion.div
            className="relative w-full h-full"
            initial={false}
            animate={{ x: isDark ? "100%" : "0%" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            style={{ x: isDark ? "calc(100% - 100%)" : "0%" }}
          >
            <motion.div
              className={`
                absolute top-0 left-0
                ${size === "sm" ? "w-5 h-5" : size === "md" ? "w-6 h-6" : "w-7 h-7"}
                rounded-full bg-white shadow-lg
                flex items-center justify-center
              `}
              layout
              transition={{ type: "spring", stiffness: 700, damping: 30 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.div
                    key="moon"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon size={sizeClasses[size].icon - 4} className="text-[var(--accent)]" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun"
                    initial={{ scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun size={sizeClasses[size].icon - 4} className="text-[var(--warning)]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
          
          {/* Background icons */}
          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
            <Sun size={sizeClasses[size].icon - 6} className="text-white/50" />
            <Moon size={sizeClasses[size].icon - 6} className="text-white/50" />
          </div>
        </button>
      </div>
    );
  }

  // Button variant - Simple icon button
  if (variant === "button") {
    return (
      <button
        onClick={toggleTheme}
        className={`
          ${sizeClasses[size].button}
          ${className}
          rounded-full
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          bg-[var(--muted)] hover:bg-[var(--accent)]
          text-[var(--muted-foreground)] hover:text-white
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]
        `}
        aria-label={isDark ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={sizeClasses[size].icon} />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ scale: 0, rotate: 90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={sizeClasses[size].icon} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    );
  }

  // Dropdown variant - Full theme selector
  if (variant === "dropdown") {
    const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
      { 
        value: "light", 
        label: "Kunduzgi", 
        icon: <Sun size={16} /> 
      },
      { 
        value: "dark", 
        label: "Tungi", 
        icon: <Moon size={16} /> 
      },
      { 
        value: "system", 
        label: "Tizim", 
        icon: <Monitor size={16} /> 
      },
    ];

    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-lg p-1">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md
                text-sm font-medium
                transition-all duration-200
                ${theme === t.value
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                }
              `}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// Theme settings panel for user preferences
export function ThemeSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Mavzu sozlamalari
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Ilova ko'rinishini moslang. Tungi rejim ko'zni asraydi, kunduzgi rejim esa yorug'likda yaxshi ko'rinadi.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Light theme option */}
        <button
          onClick={() => setTheme("light")}
          className={`
            relative p-4 rounded-xl border-2 transition-all duration-200
            ${theme === "light"
              ? "border-[var(--primary)] bg-[var(--primary)]/10"
              : "border-[var(--border)] hover:border-[var(--primary)]/50"
            }
          `}
        >
          <div className="aspect-video rounded-lg bg-white shadow-sm mb-3 flex items-center justify-center">
            <Sun size={24} className="text-[var(--warning)]" />
          </div>
          <div className="text-center">
            <p className="font-medium text-[var(--foreground)]">Kunduzgi</p>
            <p className="text-xs text-[var(--muted-foreground)]">Yorug' fon</p>
          </div>
          {theme === "light" && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center">
              <svg className="w-3 h-3 text-[var(--primary-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>

        {/* Dark theme option */}
        <button
          onClick={() => setTheme("dark")}
          className={`
            relative p-4 rounded-xl border-2 transition-all duration-200
            ${theme === "dark"
              ? "border-[var(--primary)] bg-[var(--primary)]/10"
              : "border-[var(--border)] hover:border-[var(--primary)]/50"
            }
          `}
        >
          <div className="aspect-video rounded-lg bg-[#18181F] shadow-sm mb-3 flex items-center justify-center">
            <Moon size={24} className="text-[var(--accent)]" />
          </div>
          <div className="text-center">
            <p className="font-medium text-[var(--foreground)]">Tungi</p>
            <p className="text-xs text-[var(--muted-foreground)]">To'q fon</p>
          </div>
          {theme === "dark" && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center">
              <svg className="w-3 h-3 text-[var(--primary-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>

        {/* System theme option */}
        <button
          onClick={() => setTheme("system")}
          className={`
            relative p-4 rounded-xl border-2 transition-all duration-200
            ${theme === "system"
              ? "border-[var(--primary)] bg-[var(--primary)]/10"
              : "border-[var(--border)] hover:border-[var(--primary)]/50"
            }
          `}
        >
          <div className="aspect-video rounded-lg bg-gradient-to-br from-white to-[#18181F] shadow-sm mb-3 flex items-center justify-center">
            <Monitor size={24} className="text-[var(--info)]" />
          </div>
          <div className="text-center">
            <p className="font-medium text-[var(--foreground)]">Tizim</p>
            <p className="text-xs text-[var(--muted-foreground)]">Avtomatik</p>
          </div>
          {theme === "system" && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center">
              <svg className="w-3 h-3 text-[var(--primary-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>
      </div>

      {/* Current status */}
      <div className="p-4 rounded-lg bg-[var(--muted)]">
        <p className="text-sm text-[var(--muted-foreground)]">
          Joriy rejim: <span className="font-medium text-[var(--foreground)]">
            {resolvedTheme === "dark" ? "Tungi" : "Kunduzgi"}
          </span>
          {theme === "system" && (
            <span className="text-xs"> (tizim sozlamalaridan)</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default ThemeToggle;
