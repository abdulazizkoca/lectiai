"use client";
import React, { useState, useEffect } from "react";
import { Moon, Sun, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { AutoTranslator } from "./AutoTranslator";

export function ThemeLanguageToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [lang, setLang] = useState<"uz" | "ru">("uz");

  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem("lectio-theme") as "dark" | "light" || "dark";
    const savedLang = localStorage.getItem("lectio-lang") as "uz" | "ru" || "uz";
    
    setTheme(savedTheme);
    setLang(savedLang);
    
    if (savedTheme === "light") {
      document.documentElement.removeAttribute("data-theme"); 
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("lectio-theme", newTheme);
    
    if (newTheme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  };

  const toggleLang = () => {
    const newLang = lang === "uz" ? "ru" : "uz";
    setLang(newLang);
    localStorage.setItem("lectio-lang", newLang);
  };

  return (
    <>
      <AutoTranslator lang={lang} />
      <div className="fixed top-6 right-6 z-[60] flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/20 dark:bg-white/10 border border-black/10 dark:border-white/20 text-slate-800 dark:text-white hover:bg-black/30 dark:hover:bg-white/20 transition-all text-xs font-bold shadow-lg backdrop-blur-md"
        >
          <Globe size={14} />
          {lang.toUpperCase()}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-black/20 dark:bg-white/10 border border-black/10 dark:border-white/20 text-slate-800 dark:text-white hover:bg-black/30 dark:hover:bg-white/20 transition-all shadow-lg backdrop-blur-md"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </motion.button>
      </div>
    </>
  );
}
