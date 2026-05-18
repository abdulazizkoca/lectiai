"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Plus, Sun, Moon, Globe, Menu } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onToggleMobileMenu?: () => void;
}

export function Header({ onOpenSearch, onOpenNotifications, onToggleMobileMenu }: HeaderProps) {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  
  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenSearch();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenSearch]);

  const handleNewLesson = () => {
    router.push("/professor/create-lesson");
  };

  return (
    <header className="h-16 shrink-0 bg-white/70 dark:bg-black/40 backdrop-blur-xl border-b border-black/5 dark:border-white/5 flex items-center justify-between px-6 z-30">
      
      {/* Search Input trigger */}
      <div className="flex-1 flex items-center gap-2 max-w-xl">
        <button 
          onClick={onToggleMobileMenu} 
          className="md:hidden p-2 text-slate-500 hover:text-black dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 rounded-xl border border-transparent focus:border-[#F5A623] focus:outline-none"
          aria-label="Menyuni ochish"
        >
          <Menu size={20} />
        </button>
        <button 
          onClick={onOpenSearch}
          className="w-full flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 rounded-xl transition-colors border border-transparent focus:border-[#F5A623] focus:outline-none"
        >
          <Search size={18} />
          <span className="flex-1 text-left text-sm">{language === 'uz' ? 'Izlash...' : language === 'ru' ? 'Поиск...' : 'Search...'}</span>
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold bg-white dark:bg-black/20 px-2 py-1 rounded shadow-sm">
            <span className="text-lg leading-none">⌘</span>
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4 ml-6">
        {/* Language Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-white/5 rounded-lg p-1 border border-black/5 dark:border-white/5">
          {(['uz', 'ru', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                language === lang 
                  ? 'bg-[#F5A623] text-black shadow-sm' 
                  : 'text-slate-500 hover:text-black dark:hover:text-white'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center text-[#F5A623] hover:text-[#f7b955] transition-all bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg border border-black/5 dark:border-white/5 shadow-sm"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />

        <button 
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-500 hover:text-black dark:hover:text-white transition-colors"
          aria-label="Bildirishnomalar"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-[#E84855] rounded-full border-2 border-white dark:border-[#18181F]" />
        </button>

        <Avatar initials="JD" status="online" className="cursor-pointer hover:ring-2 ring-[#F5A623] transition-all hidden sm:flex" />
      </div>
    </header>
  );
}
