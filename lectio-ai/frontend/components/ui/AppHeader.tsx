"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Globe, User, Settings, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage, Language } from "@/contexts/LanguageContext";

export function AppHeader() {
  const { resolvedTheme, toggleTheme, isDark } = useTheme();
  const { language, setLanguage, t, isUZ, isRU, isEN } = useLanguage();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "uz", label: "O'zbek", flag: "🇺🇿" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "en", label: "English", flag: "🇬🇧" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)]">
      <div className="h-full px-4 md:px-6 flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--saffron)] to-[var(--coral)] flex items-center justify-center">
            <span className="text-black font-bold text-sm">L</span>
          </div>
          <span className="font-bold text-lg text-[var(--foreground)]">
            Lectio AI
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative group">
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              aria-label={t("language.title")}
            >
              <Globe size={18} />
              <span className="hidden sm:inline text-sm font-medium">
                {isUZ ? "UZ" : isRU ? "RU" : "EN"}
              </span>
            </button>

            {/* Language Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-40 py-2 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`w-full px-4 py-2 flex items-center gap-3 text-sm transition-colors ${
                    language === lang.code
                      ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            aria-label={isDark ? t("theme.light") : t("theme.dark")}
          >
            <motion.div
              initial={false}
              animate={{ rotate: isDark ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {isDark ? (
                <Moon size={18} className="text-[var(--primary)]" />
              ) : (
                <Sun size={18} className="text-[var(--warning)]" />
              )}
            </motion.div>
            <span className="hidden sm:inline text-sm font-medium">
              {isDark ? t("theme.dark") : t("theme.light")}
            </span>
          </button>

          {/* User Menu */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
              <User size={18} />
            </button>

            <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button className="w-full px-4 py-2 flex items-center gap-3 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
                <User size={16} />
                <span>{t("nav.profile")}</span>
              </button>
              <button className="w-full px-4 py-2 flex items-center gap-3 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
                <Settings size={16} />
                <span>{t("nav.settings")}</span>
              </button>
              <hr className="my-2 border-[var(--border)]" />
              <button className="w-full px-4 py-2 flex items-center gap-3 text-sm text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors">
                <LogOut size={16} />
                <span>{t("nav.logout")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
