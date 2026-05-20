"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/professor/Sidebar";
import { Header } from "@/components/professor/Header";
import { SearchModal } from "@/components/professor/SearchModal";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Bell, CheckCircle2, X } from "lucide-react";

export default function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Yangi talaba qo'shildi", body: "Ali Karimov dars xonasiga kirdi.", read: false },
    { id: 2, title: "Diqqat pasaydi", body: "Sinf o'rtacha diqqat darajasi 68% ga tushdi.", read: false },
    { id: 3, title: "Material tayyor", body: "AI dars rejasi va quiz savollarini yaratdi.", read: true },
  ]);
  const { isDark } = useTheme();
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    if (language === "en") {
      setLanguage("uz");
    }
  }, [language, setLanguage]);

  return (
    <div className="flex h-[100dvh] bg-[#FAFAF7] dark:bg-[#050508] overflow-hidden relative">
      {/* Background Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1920&q=80')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: isDark ? 0.15 : 0.08,
            filter: "grayscale(100%) contrast(1.2) brightness(0.7)",
          }}
        />
        {/* Ambient Glows */}
        <div
          className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-[0.1]"
          style={{ background: "#1B4FD8", filter: "blur(120px)" }}
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-[0.1]"
          style={{ background: "#F5A623", filter: "blur(120px)" }}
        />
      </div>

      <Sidebar isMobileOpen={isMobileMenuOpen} onCloseMobile={() => setIsMobileMenuOpen(false)} />
      <div className="min-w-0 flex-1 flex flex-col overflow-hidden relative z-10 w-full">
        <Header 
          onOpenSearch={() => setIsSearchOpen(true)} 
          onOpenNotifications={() => setIsNotificationsOpen(true)} 
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <main className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
      
      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      {isNotificationsOpen && (
        <div className="fixed inset-0 z-[90] flex items-start justify-end bg-black/40 backdrop-blur-sm p-4 md:p-6" onClick={() => setIsNotificationsOpen(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#101018] shadow-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5A623]/15 text-[#F5A623]">
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-950 dark:text-white">Bildirishnomalar</h2>
                  <p className="text-xs text-slate-500">{notifications.filter((item) => !item.read).length} ta yangi xabar</p>
                </div>
              </div>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                aria-label="Bildirishnomalarni yopish"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-3">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setNotifications((prev) => prev.map((n) => n.id === item.id ? { ...n, read: true } : n))}
                  className="mb-2 flex w-full items-start gap-3 rounded-xl p-4 text-left transition hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  <CheckCircle2 size={18} className={item.read ? "text-slate-400" : "text-[#0D9373]"} />
                  <span className="flex-1">
                    <span className="block font-semibold text-slate-900 dark:text-white">{item.title}</span>
                    <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{item.body}</span>
                  </span>
                  {!item.read && <span className="mt-1 h-2 w-2 rounded-full bg-[#E84855]" />}
                </button>
              ))}
            </div>
            <div className="border-t border-black/5 dark:border-white/10 p-3">
              <button
                onClick={() => setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))}
                className="w-full rounded-xl bg-[#F5A623] px-4 py-3 text-sm font-bold text-black transition hover:bg-[#f7b955]"
              >
                Hammasini o'qilgan qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
