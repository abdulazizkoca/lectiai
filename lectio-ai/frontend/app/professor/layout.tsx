"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/professor/Sidebar";
import { Header } from "@/components/professor/Header";
import { SearchModal } from "@/components/professor/SearchModal";
import { useTheme } from "@/contexts/ThemeContext";

export default function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark } = useTheme();

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
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 w-full">
        <Header 
          onOpenSearch={() => setIsSearchOpen(true)} 
          onOpenNotifications={() => setIsNotificationsOpen(true)} 
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
      
      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </div>
  );
}
