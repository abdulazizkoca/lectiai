"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Globe, Monitor, Settings2, Check } from "lucide-react";
import { useTheme, Theme } from "@/contexts/ThemeContext";
import { useLanguage, Language } from "@/contexts/LanguageContext";

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme, isDark } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: t("theme.light"), icon: <Sun size={20} /> },
    { value: "dark", label: t("theme.dark"), icon: <Moon size={20} /> },
    { value: "system", label: t("theme.system"), icon: <Monitor size={20} /> },
  ];

  const languages: { code: Language; label: string; native: string; flag: string }[] = [
    { code: "uz", label: t("language.uz"), native: "O'zbek", flag: "🇺🇿" },
    { code: "ru", label: t("language.ru"), native: "Русский", flag: "🇷🇺" },
    { code: "en", label: t("language.en"), native: "English", flag: "🇬🇧" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            {t("nav.settings")}
          </h1>
          <p className="text-[var(--muted-foreground)]">
            {t("common.configure") || "Ilova sozlamalarini o'zgartiring"}
          </p>
        </motion.div>

        {/* Theme Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                <Settings2 size={20} className="text-[var(--primary)]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  {t("theme.title")}
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Ilova ko'rinishini tanlang
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    theme === t.value
                      ? "border-[var(--primary)] bg-[var(--primary)]/5"
                      : "border-[var(--border)] hover:border-[var(--primary)]/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`${theme === t.value ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`}>
                      {t.icon}
                    </div>
                    {theme === t.value && (
                      <div className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center">
                        <Check size={12} className="text-[var(--primary-foreground)]" />
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-[var(--foreground)]">{t.label}</p>
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-[var(--muted)]">
              <p className="text-sm text-[var(--muted-foreground)]">
                Joriy rejim: <span className="font-medium text-[var(--foreground)]">
                  {resolvedTheme === "dark" ? t("theme.dark") : t("theme.light")}
                </span>
                {theme === "system" && (
                  <span className="text-xs"> (tizim sozlamalaridan)</span>
                )}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Language Settings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                <Globe size={20} className="text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  {t("language.title")}
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Ilova tilini tanlang
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                    language === lang.code
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border)] hover:border-[var(--accent)]/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="text-left">
                      <p className="font-medium text-[var(--foreground)]">
                        {lang.native}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {lang.label}
                      </p>
                    </div>
                  </div>
                  {language === lang.code && (
                    <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                      <Check size={12} className="text-[var(--accent-foreground)]" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-[var(--muted)]">
              <p className="text-sm text-[var(--muted-foreground)]">
                Joriy til: <span className="font-medium text-[var(--foreground)]">
                  {languages.find(l => l.code === language)?.native}
                </span>
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
